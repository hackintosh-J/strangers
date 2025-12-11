import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign, verify } from 'hono/jwt';

const app = new Hono();
const JWT_SECRET = 'strangers-secret-key-change-me'; // In prod use env var

app.use('/*', cors());

// Middleware to protect routes
const authMiddleware = async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = await verify(token, JWT_SECRET);
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

    // Real implementation: Password hashing needed (Using simple text for demo speed, upgrade later)
    // Check if user exists
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existing) return c.json({ error: 'Username taken' }, 409);

    try {
        const { success } = await c.env.DB.prepare(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
        ).bind(username, password, 'user').run(); // Default role user
        return c.json({ success });
    } catch (e) {
        return c.json({ error: 'Database error' }, 500);
    }
});

app.post('/api/auth/login', async (c) => {
    const { username, password } = await c.req.json();
    const user = await c.env.DB.prepare(
        'SELECT * FROM users WHERE username = ?'
    ).bind(username).first();

    if (!user || user.password_hash !== password) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = await sign({
        id: user.id,
        username: user.username,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
    }, JWT_SECRET);

    return c.json({
        token,
        user: { id: user.id, username: user.username, role: user.role }
    });
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
