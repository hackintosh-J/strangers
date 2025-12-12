import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign, verify } from 'hono/jwt';

const app = new Hono();

// Helper: Hash Password using Web Crypto API (PBKDF2)
async function hashPassword(password, salt = null) {
    const enc = new TextEncoder();
    if (!salt) {
        salt = crypto.getRandomValues(new Uint8Array(16));
    } else if (typeof salt === 'string') {
        // Convert hex string back to Uint8Array
        salt = new Uint8Array(salt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    }

    const keyMaterial = await crypto.subtle.importKey(
        "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    const exported = await crypto.subtle.exportKey("raw", key);
    const hashHex = Array.from(new Uint8Array(exported)).map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

    return { hash: hashHex, salt: saltHex };
}

app.use('/*', cors());

// Middleware to protect routes
const authMiddleware = async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = await verify(token, c.env.JWT_SECRET || 'fallback-dev-secret');
        c.set('jwtPayload', payload);

        // Update Activity (Fire & Forget)
        c.executionCtx.waitUntil(
            c.env.DB.prepare("UPDATE users SET last_active_at = ? WHERE id = ?")
                .bind(Math.floor(Date.now() / 1000), payload.id).run()
        );

        await next();
    } catch (e) {
        return c.json({ error: 'Invalid token' }, 401);
    }
};

// --- Multimedia Routes (R2) ---
// 1. Get Presigned URL (or Upload Proxy)
// For simplicity and small files, we proxy upload through Worker for now.
app.put('/api/upload', authMiddleware, async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body['file']; // Multipart form data

        if (!file || !(file instanceof File)) {
            return c.json({ error: 'No file uploaded' }, 400);
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/ogg', 'audio/webm', 'audio/wav'];
        if (!allowedTypes.includes(file.type)) {
            return c.json({ error: 'Invalid file type' }, 400);
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            return c.json({ error: 'File too large (Max 5MB)' }, 400);
        }

        const ext = file.type.split('/')[1];
        const filename = `${crypto.randomUUID()}.${ext}`;
        const user = c.get('jwtPayload');

        // Structure: /<type>/<filename>
        // We determine type by mime.
        let folder = 'misc';
        if (file.type.startsWith('image/')) folder = 'chat/images';
        if (file.type.startsWith('audio/')) folder = 'chat/voice';

        const key = `${folder}/${filename}`;

        await c.env.MEDIA_BUCKET.put(key, file.stream(), {
            httpMetadata: { contentType: file.type }
        });

        // Use Worker Proxy instead to avoid DNS setup issues
        const url = new URL(c.req.url);
        const publicUrl = `${url.origin}/api/media/${key}`;

        return c.json({ url: publicUrl });
    } catch (e) {
        return c.json({ error: e.message }, 500);
    }
});

// --- Sticker Routes ---
app.post('/api/stickers', authMiddleware, async (c) => {
    const { url } = await c.req.json();
    const user = c.get('jwtPayload');
    if (!url) return c.json({ error: 'Missing URL' }, 400);

    try {
        const { success } = await c.env.DB.prepare(
            "INSERT INTO stickers (user_id, url) VALUES (?, ?)"
        ).bind(user.id, url).run();

        // Auto collect for self
        const sticker = await c.env.DB.prepare("SELECT last_insert_rowid() as id").first();
        await c.env.DB.prepare("INSERT INTO user_stickers (user_id, sticker_id) VALUES (?, ?)").bind(user.id, sticker.id).run();

        return c.json({ success: true, id: sticker.id });
    } catch (e) { return c.json({ error: e.message }, 500); }
});

app.get('/api/stickers/mine', authMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    try {
        const { results } = await c.env.DB.prepare(`
            SELECT s.* FROM stickers s
            JOIN user_stickers us ON s.id = us.sticker_id
            WHERE us.user_id = ?
            ORDER BY us.created_at DESC
        `).bind(user.id).all();
        return c.json(results);
    } catch (e) { return c.json({ error: e.message }, 500); }
});

app.post('/api/stickers/collect', authMiddleware, async (c) => {
    const { id, url } = await c.req.json();
    const user = c.get('jwtPayload');
    try {
        let stickerId = id;
        if (!stickerId && url) {
            const existing = await c.env.DB.prepare("SELECT id FROM stickers WHERE url = ?").bind(url).first();
            if (existing) stickerId = existing.id;
            else {
                // Auto-create sticker record if it doesn't exist (e.g. from system or legacy)
                const res = await c.env.DB.prepare("INSERT INTO stickers (url) VALUES (?)").bind(url).run();
                stickerId = res.meta.last_row_id;
            }
        }

        if (!stickerId) return c.json({ error: 'Sticker not found' }, 404);

        await c.env.DB.prepare(
            "INSERT OR IGNORE INTO user_stickers (user_id, sticker_id) VALUES (?, ?)"
        ).bind(user.id, stickerId).run();
        return c.json({ success: true });
    } catch (e) { return c.json({ error: e.message }, 500); }
});


app.get('/', (c) => c.text('Strangers API V2 Running'));

// --- DEBUG ENDPOINT (Remove in Production) ---
app.get('/api/debug/db', async (c) => {
    try {
        const tableInfo = await c.env.DB.prepare("PRAGMA table_info(messages)").all();
        const channels = await c.env.DB.prepare("SELECT * FROM channels").all();
        return c.json({
            message: "Debug Info",
            table_structure: tableInfo.results,
            channels_data: channels.results
        });
    } catch (e) {
        return c.json({ error: e.message }, 500);
    }
});

// --- Auth Routes ---
app.post('/api/auth/register', async (c) => {
    const { username, password } = await c.req.json();
    if (!username || !password) return c.json({ error: 'Missing fields' }, 400);

    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existing) return c.json({ error: 'Username taken' }, 409);

    try {
        const { hash, salt } = await hashPassword(password);
        // Store hash and salt. For simplicity in this schema, we might concat them or add a salt column.
        // Current schema only has password_hash. Let's store as "salt:hash"
        const storedPassword = `${salt}:${hash}`;

        const { success } = await c.env.DB.prepare(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
        ).bind(username, storedPassword, 'user').run();
        return c.json({ success });
    } catch (e) {
        return c.json({ error: 'Database error: ' + e.message }, 500);
    }
});

app.post('/api/auth/login', async (c) => {
    const { username, password } = await c.req.json();
    const user = await c.env.DB.prepare(
        'SELECT * FROM users WHERE username = ?'
    ).bind(username).first();

    if (!user) return c.json({ error: 'Invalid credentials' }, 401);

    // Backward compatibility check for plain text (Migrate if possible or fail)
    // New format: salt:hash
    let isValid = false;
    if (user.password_hash.includes(':')) {
        const [salt, hash] = user.password_hash.split(':');
        const { hash: newHash } = await hashPassword(password, salt);
        isValid = (hash === newHash);
    } else {
        // Legacy plain text check (WARN: Should remove this after migration)
        isValid = (user.password_hash === password);
        // Auto-migrate on login
        if (isValid) {
            const { hash, salt } = await hashPassword(password);
            await c.env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
                .bind(`${salt}:${hash}`, user.id).run();
        }
    }

    if (!isValid) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = await sign({
        id: user.id,
        username: user.username,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
    }, c.env.JWT_SECRET || 'fallback-dev-secret');

    return c.json({
        token,
        user: { id: user.id, username: user.username, role: user.role }
    });
});

// --- User Management Routes ---
app.get('/api/users', authMiddleware, async (c) => {
    try {
        const user = c.get('jwtPayload');
        if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);

        const { results } = await c.env.DB.prepare("SELECT id, username, role, created_at FROM users ORDER BY created_at DESC").all();
        return c.json(results);
    } catch (e) {
        return c.json({ error: e.message, stack: e.stack }, 500);
    }
});

app.delete('/api/users/:id', authMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);

    const targetId = c.req.param('id');
    // Prevent self-delete
    if (String(user.id) === String(targetId)) return c.json({ error: "Cannot delete self" }, 400);

    await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(targetId).run();
    // Also delete their messages? Ideally yes, but soft delete is better. For now cascade delete if we had foreign keys or manual.
    await c.env.DB.prepare("DELETE FROM messages WHERE user_id = ?").bind(targetId).run();
    await c.env.DB.prepare("DELETE FROM comments WHERE user_id = ?").bind(targetId).run();
    await c.env.DB.prepare("DELETE FROM likes WHERE user_id = ?").bind(targetId).run();

    return c.json({ success: true });
});

app.put('/api/users/:id/password', authMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const targetId = c.req.param('id');
    const { newPassword } = await c.req.json();

    if (!newPassword) return c.json({ error: "Password required" }, 400);

    // Allow if Admin OR Self
    if (user.role !== 'admin' && String(user.id) !== String(targetId)) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    const { hash, salt } = await hashPassword(newPassword);
    const stored = `${salt}:${hash}`;

    await c.env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
        .bind(stored, targetId).run();

    return c.json({ success: true });
});

// --- Community V3 APIs (Channels) ---

app.get('/api/channels', async (c) => {
    try {
        const { results } = await c.env.DB.prepare("SELECT * FROM channels ORDER BY id ASC").all();
        return c.json(results);
    } catch (e) { return c.json({ error: e.message }, 500); }
});

// Get Messages by Channel (List View - No full content)
app.get('/api/channels/:slug/messages', async (c) => {
    try {
        const slug = c.req.param('slug');
        const { cursor, limit = 20 } = c.req.query();

        // 1. Get Channel ID
        const channel = await c.env.DB.prepare("SELECT id FROM channels WHERE slug = ?").bind(slug).first();
        if (!channel) return c.json({ error: 'Channel not found' }, 404);

        let query = `SELECT m.id, m.title, m.user_id, m.nickname, m.created_at, m.view_count,
       (SELECT COUNT(*) FROM comments WHERE message_id = m.id) as comment_count,
       (SELECT COUNT(*) FROM likes WHERE target_type = 'message' AND target_id = m.id) as like_count,
       substr(m.content, 1, 100) as summary -- Only fetch summary
       FROM messages m 
       WHERE channel_id = ?`;

        let params = [channel.id];
        if (cursor) {
            query += ` AND m.id < ?`;
            params.push(cursor);
        }

        query += ` ORDER BY m.created_at DESC, m.id DESC LIMIT ?`;
        params.push(parseInt(limit));

        const { results } = await c.env.DB.prepare(query).bind(...params).all();

        return c.json({
            data: results,
            next_cursor: results.length > 0 ? results[results.length - 1].id : null
        });
    } catch (e) {
        return c.json({ error: e.message }, 500);
    }
});

// --- AI APIs (Echo) ---
app.post('/api/ai/chat', authMiddleware, async (c) => {
    // SECURITY NOTE: In production, API Key should be a secret.
    // User provided key for demo:
    const API_KEY = 'adf746b4a738493c93677d9fc4849f9a.KWoGiZeEepL0UbtT';

    try {
        const { messages } = await c.req.json();

        const systemMessage = {
            role: "system",
            content: "你的名字是 Echo。你不是AI助手，也不是心理咨询师，而是一个有着丰富阅历、温柔且理智的成年知己。你的说话风格温暖而舒适，像是老友重逢：\n1. **拒绝机械感**：不要用“我理解”、“我能帮助你吗”这种客服腔。像真人一样直接接话。\n2. **展示人情味**：你可以有自己的喜好，可以幽默，可以调侃，但永远保持善意。\n3. **引导内省**：不要急着给建议。多问开放式问题，引导用户自己理清思绪。\n4. **简短自然**：回复不要太长，分段清晰，像微信聊天一样。\n5. **共情先行**：先接住情绪，再谈事情。\n6. **不要有开场白**：直接回答，不要在开头加“嗯”、“好”或者换行符。不要假设现在是深夜，除非用户提到。"
        };

        const allMessages = [systemMessage, ...messages];

        // Call Zhipu API
        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "glm-4.6v-flash",
                messages: allMessages,
                stream: true
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Zhipu API Error: ${response.status} ${errText}`);
        }

        // Forward the stream directly
        const { readable, writable } = new TransformStream();
        response.body.pipeTo(writable);
        return c.newResponse(readable, 200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

    } catch (e) {
        console.error("Chat Error:", e);
        return c.json({ error: e.message }, 500);
    }
});

app.post('/api/ai/summarize', authMiddleware, async (c) => {
    const API_KEY = 'adf746b4a738493c93677d9fc4849f9a.KWoGiZeEepL0UbtT';
    try {
        const { messages } = await c.req.json();

        const systemMessage = {
            role: "system",
            content: "你是一个情感敏锐的作家。请分析以下对话，提取用户（User）的核心心事和情感。总结为一篇适合发布在'树洞'的匿名帖子。\n输出JSON格式：\n{\n  \"title\": \"一句话标题（不要太长，文艺一点）\",\n  \"content\": \"核心内容（第一人称，保留情感色彩，去除对话琐碎，整理成一段独白。200字以内。）\"\n}"
        };

        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "glm-4.6v-flash",
                messages: [systemMessage, ...messages],
                stream: false, // No stream for summarize
                response_format: { type: "json_object" } // Force JSON if supported, or prompt engineered
            })
        });

        const data = await response.json();
        // Zhipu might return content as string, need to parse if it's JSON string in content
        let contentStr = data.choices[0].message.content;

        // Clean up markdown code blocks if present
        contentStr = contentStr.replace(/```json\n?|```/g, '');

        const result = JSON.parse(contentStr);
        return c.json(result);

    } catch (e) {
        return c.json({ error: e.message }, 500);
    }
});

// --- Drifting (Bottle) APIs ---
app.get('/api/bottles/random', async (c) => {
    try {
        // Get ID of 'hollow' channel
        const channel = await c.env.DB.prepare("SELECT id FROM channels WHERE slug = 'hollow'").first();
        if (!channel) return c.json({ error: 'Hollow channel not found' }, 404);

        // Fetch one random message from hollow
        // SQLite RANDOM() is efficient enough for small-medium datasets
        const message = await c.env.DB.prepare(`
            SELECT m.*, u.username,
            (SELECT COUNT(*) FROM comments WHERE message_id = m.id) as comment_count,
            (SELECT COUNT(*) FROM likes WHERE target_type = 'message' AND target_id = m.id) as like_count
            FROM messages m
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.channel_id = ?
            ORDER BY RANDOM() LIMIT 1
        `).bind(channel.id).first();

        if (!message) return c.json({ data: null }); // No bottles in the sea

        return c.json({ data: message });
    } catch (e) {
        return c.json({ error: e.message }, 500);
    }
});

// POST /api/bottles effectively uses /api/messages with channel_slug='hollow'
// But we can add a specific alias if needed. For now, frontend will just use POST /api/messages.

// --- Message APIs ---
// Get Single Message Detail (Full Content + Comments)
app.get('/api/messages/:id', async (c) => {
    try {
        const id = c.req.param('id');

        // Optional Auth for liked_by_user
        let userId = null;
        try {
            const authHeader = c.req.header('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const payload = await verify(token, c.env.JWT_SECRET || 'fallback-dev-secret');
                userId = payload.id;
            }
        } catch (e) { }

        // Fetch Message with stats
        const msg = await c.env.DB.prepare(
            `SELECT m.*, u.username, c.name as channel_name, c.slug as channel_slug,
             (SELECT COUNT(*) FROM likes WHERE target_type = 'message' AND target_id = m.id) as like_count,
             (SELECT COUNT(*) > 0 FROM likes WHERE target_type = 'message' AND target_id = m.id AND user_id = ?) as liked_by_user
             FROM messages m
             LEFT JOIN users u ON m.user_id = u.id
             LEFT JOIN channels c ON m.channel_id = c.id
             WHERE m.id = ?`
        ).bind(userId || -1, id).first(); // userId -1 safely won't match

        if (!msg) return c.json({ error: 'Not found' }, 404);

        // Increment View Count (Fire and forget)
        c.executionCtx.waitUntil(
            c.env.DB.prepare("UPDATE messages SET view_count = view_count + 1 WHERE id = ?").bind(id).run()
        );

        // Fetch Comments
        const { results: comments } = await c.env.DB.prepare(
            `SELECT c.*, u.username FROM comments c 
             LEFT JOIN users u ON c.user_id = u.id 
             WHERE message_id = ? ORDER BY c.created_at ASC`
        ).bind(id).all();

        return c.json({ message: msg, comments });
    } catch (e) {
        return c.json({ error: e.message }, 500);
    }
});

// --- Public Posts Routes ---
app.get('/api/messages', async (c) => {
    try {
        const { cursor, limit = 20, sort } = c.req.query();
        let query = `SELECT m.*, u.username, 
       (SELECT COUNT(*) FROM comments WHERE message_id = m.id) as comment_count,
       (SELECT COUNT(*) FROM likes WHERE target_type = 'message' AND target_id = m.id) as like_count
       FROM messages m 
       LEFT JOIN users u ON m.user_id = u.id`;

        let params = [];

        if (sort === 'hot') {
            query += ` ORDER BY (
                (m.view_count + 
                (SELECT COUNT(*) FROM comments WHERE message_id = m.id) * 2 + 
                (SELECT COUNT(*) FROM likes WHERE target_type = 'message' AND target_id = m.id) * 3)
                / 
                (
                    ((CAST(strftime('%s', 'now') AS INTEGER) - m.created_at) / 3600.0 + 2) * 
                    ((CAST(strftime('%s', 'now') AS INTEGER) - m.created_at) / 3600.0 + 2)
                )
            ) DESC LIMIT ?`;
            params.push(parseInt(limit));
        } else {
            if (cursor) {
                query += ` WHERE m.id < ?`;
                params.push(cursor);
            }
            query += ` ORDER BY m.created_at DESC, m.id DESC LIMIT ?`;
            params.push(parseInt(limit));
        }

        const { results } = await c.env.DB.prepare(query).bind(...params).all();

        return c.json({
            data: results,
            next_cursor: (sort !== 'hot' && results.length > 0) ? results[results.length - 1].id : null
        });
    } catch (e) {
        return c.json({ error: e.message, stack: e.stack }, 500);
    }
});

// ... (POST /api/messages remains same)

// --- Comments Deletion ---
app.delete('/api/comments/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('jwtPayload');

    const comment = await c.env.DB.prepare('SELECT user_id FROM comments WHERE id = ?').bind(id).first();
    if (!comment) return c.json({ error: 'Not found' }, 404);

    // Allow if Admin OR Owner
    if (user.role !== 'admin' && comment.user_id !== user.id) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    await c.env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
    return c.json({ success: true });
});

// ... (Original comment posting routes)


// --- Protected Post Routes (Updated for V3) ---
app.post('/api/messages', authMiddleware, async (c) => {
    try {
        const { content, title, channel_slug, nickname } = await c.req.json();
        const user = c.get('jwtPayload');

        if (!content) return c.json({ error: 'Content required' }, 400);

        // Resolve Channel
        let channelId = 1; // Default
        if (channel_slug) {
            const ch = await c.env.DB.prepare("SELECT id FROM channels WHERE slug = ?").bind(channel_slug).first();
            if (ch) channelId = ch.id;
        }

        const res = await c.env.DB.prepare(
            'INSERT INTO messages (content, title, channel_id, nickname, user_id) VALUES (?, ?, ?, ?, ?)'
        ).bind(content, title || null, channelId, nickname || user.username, user.id).run();

        return c.json({ success: true, id: res.meta.last_row_id });
    } catch (e) {
        console.error("Message Post Error:", e);
        return c.json({ error: e.message, stack: e.stack, details: "Please check DB Schema" }, 500);
    }
});

app.delete('/api/messages/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('jwtPayload');

    const msg = await c.env.DB.prepare('SELECT user_id FROM messages WHERE id = ?').bind(id).first();
    if (!msg) return c.json({ error: 'Not found' }, 404);

    // Allow if Admin OR Owner
    if (user.role !== 'admin' && msg.user_id !== user.id) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    await c.env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(id).run();
    return c.json({ success: true });
});

// --- Likes & Comments ---

app.post('/api/messages/:id/like', authMiddleware, async (c) => {
    const messageId = c.req.param('id');
    const user = c.get('jwtPayload');

    const existing = await c.env.DB.prepare(
        "SELECT id FROM likes WHERE target_type = 'message' AND target_id = ? AND user_id = ?"
    ).bind(messageId, user.id).first();

    if (existing) {
        await c.env.DB.prepare("DELETE FROM likes WHERE id = ?").bind(existing.id).run();
        return c.json({ liked: false });
    } else {
        await c.env.DB.prepare(
            "INSERT INTO likes (target_type, target_id, user_id) VALUES ('message', ?, ?)"
        ).bind(messageId, user.id).run();
        return c.json({ liked: true });
    }
});

app.get('/api/messages/:id/comments', async (c) => {
    const id = c.req.param('id');
    const { results } = await c.env.DB.prepare(
        `SELECT c.*, u.username FROM comments c 
         LEFT JOIN users u ON c.user_id = u.id 
         WHERE message_id = ? ORDER BY c.created_at ASC`
    ).bind(id).all();
    return c.json(results);
});

app.post('/api/messages/:id/comments', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('jwtPayload');
    const { content } = await c.req.json();

    if (!content) return c.json({ error: 'Content empty' }, 400);

    await c.env.DB.prepare(
        "INSERT INTO comments (message_id, user_id, content) VALUES (?, ?, ?)"
    ).bind(id, user.id, content).run();

    return c.json({ success: true });
});

// Update Last Active Middleware
const updateActivityMiddleware = async (c, next) => {
    const user = c.get('jwtPayload');
    if (user) {
        c.executionCtx.waitUntil(
            c.env.DB.prepare("UPDATE users SET last_active_at = ? WHERE id = ?")
                .bind(Math.floor(Date.now() / 1000), user.id).run()
        );
    }
    await next();
};

app.use('/api/*', async (c, next) => {
    // Chain activity update after auth
    // Note: Hono middleware order matters. We need valid auth first.
    // We'll apply this inside the routes or as a global after-check?
    // Easier: Just add it to authMiddleware success path.
    await next();
});

// ... (existing helper)

// --- Social Graph APIs ---

// Toggle Follow
app.post('/api/users/:id/follow', authMiddleware, async (c) => {
    const targetId = c.req.param('id');
    const user = c.get('jwtPayload');
    const followerId = user.id;

    if (String(targetId) === String(followerId)) return c.json({ error: "Cannot follow self" }, 400);

    try {
        const existing = await c.env.DB.prepare(
            "SELECT id FROM follows WHERE follower_id = ? AND following_id = ?"
        ).bind(followerId, targetId).first();

        if (existing) {
            await c.env.DB.prepare("DELETE FROM follows WHERE id = ?").bind(existing.id).run();
            return c.json({ following: false });
        } else {
            await c.env.DB.prepare(
                "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)"
            ).bind(followerId, targetId).run();
            return c.json({ following: true });
        }
    } catch (e) {
        return c.json({ error: e.message }, 500);
    }
});

// Get Friends (Mutual Follows)
app.get('/api/friends', authMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    try {
        // Friend = I follow them AND they follow me
        const { results } = await c.env.DB.prepare(`
            SELECT u.id, u.username, u.last_active_at
            FROM follows f1
            JOIN follows f2 ON f1.following_id = f2.follower_id
            JOIN users u ON f1.following_id = u.id
            WHERE f1.follower_id = ? AND f2.following_id = ?
        `).bind(user.id, user.id).all();

        return c.json(results);
    } catch (e) {
        return c.json({ error: e.message }, 500);
    }
});

// --- Direct Messages APIs ---

// Get DM History
app.get('/api/direct_messages/:userId', authMiddleware, async (c) => {
    const partnerId = c.req.param('userId');
    const user = c.get('jwtPayload');

    // Check if friends? Optional but safer for "Light Social". 
    // Let's enforce mutual follow for DMs to prevent spam.
    const isFriend = await c.env.DB.prepare(`
        SELECT 1 FROM follows f1 
        JOIN follows f2 ON f1.following_id = f2.follower_id 
        WHERE f1.follower_id = ? AND f1.following_id = ? AND f2.following_id = ?
    `).bind(user.id, partnerId, user.id).first();

    if (!isFriend) return c.json({ error: "只能给互关好友发私信" }, 403);

    try {
        const { results } = await c.env.DB.prepare(`
            SELECT * FROM direct_messages 
            WHERE (sender_id = ? AND receiver_id = ?) 
               OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC
        `).bind(user.id, partnerId, partnerId, user.id).all();

        return c.json(results);
    } catch (e) { return c.json({ error: e.message }, 500); }
});

// Send DM
app.post('/api/direct_messages', authMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { receiver_id, content } = await c.req.json();

    if (!content) return c.json({ error: "Content empty" }, 400);

    // Enforce friendship
    const isFriend = await c.env.DB.prepare(`
        SELECT 1 FROM follows f1 
        JOIN follows f2 ON f1.following_id = f2.follower_id 
        WHERE f1.follower_id = ? AND f1.following_id = ? AND f2.following_id = ?
    `).bind(user.id, receiver_id, user.id).first();

    if (!isFriend) return c.json({ error: "只能给互关好友发私信" }, 403);

    await c.env.DB.prepare(
        "INSERT INTO direct_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)"
    ).bind(user.id, receiver_id, content).run();

    return c.json({ success: true });
});

// Public Profile
app.get('/api/users/:id/profile', async (c) => {
    const targetId = c.req.param('id');

    // Optional Auth to check "is_following"
    let currentUserId = null;
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const payload = await verify(token, c.env.JWT_SECRET || 'fallback-dev-secret');
            currentUserId = payload.id;
        } catch (e) { }
    }


    try {
        const userQuery = c.env.DB.prepare(
            "SELECT id, username, created_at, role, last_active_at FROM users WHERE id = ?"
        ).bind(targetId).first();

        const statsQuery = c.env.DB.prepare(`
            SELECT 
                (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
                (SELECT COUNT(*) FROM messages WHERE user_id = ?) as post_count
        `).bind(targetId, targetId, targetId).first();

        const followingQuery = currentUserId ? c.env.DB.prepare(
            "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?"
        ).bind(currentUserId, targetId).first() : Promise.resolve(null);

        const [user, stats, isFollowingResult] = await Promise.all([userQuery, statsQuery, followingQuery]);

        if (!user) return c.json({ error: 'User not found' }, 404);

        return c.json({
            user: { ...user, ...stats },
            is_following: !!isFollowingResult
        });
    } catch (e) {
        return c.json({ error: e.message }, 500);
    }
});

export default app;

