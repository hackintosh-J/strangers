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
        await next();
    } catch (e) {
        return c.json({ error: 'Invalid token' }, 401);
    }
};

app.get('/', (c) => c.text('Strangers API V2 Running'));

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
    const user = c.get('jwtPayload');
    if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);

    const { results } = await c.env.DB.prepare("SELECT id, username, role, created_at FROM users ORDER BY created_at DESC").all();
    return c.json(results);
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

// --- Public Posts Routes ---
app.get('/api/messages', async (c) => {
    try {
        const { results } = await c.env.DB.prepare(
            `SELECT m.*, u.username, 
       (SELECT COUNT(*) FROM comments WHERE message_id = m.id) as comment_count,
       (SELECT COUNT(*) FROM likes WHERE target_type = 'message' AND target_id = m.id) as like_count
       FROM messages m 
       LEFT JOIN users u ON m.user_id = u.id 
       ORDER BY m.created_at DESC LIMIT 50`
        ).all();
        return c.json(results);
    } catch (e) {
        return c.json({ error: e.message, stack: e.stack }, 500);
    }
});

// --- Protected Post Routes ---
app.post('/api/messages', authMiddleware, async (c) => {
    try {
        const { content, nickname } = await c.req.json();
        const user = c.get('jwtPayload');

        if (!content) return c.json({ error: 'Content required' }, 400);

        const res = await c.env.DB.prepare(
            'INSERT INTO messages (content, nickname, user_id) VALUES (?, ?, ?)'
        ).bind(content, nickname || user.username, user.id).run();

        return c.json({ success: true, id: res.meta.last_row_id });
    } catch (e) {
        return c.json({ error: e.message }, 500);
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

export default app;
