import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('/*', cors());

// Middleware to inject DB into context if needed, or access via c.env.DB

app.get('/', (c) => c.text('Strangers API V2'));

// --- Auth Routes ---
app.post('/api/auth/register', async (c) => {
    const { username, password } = await c.req.json();
    if (!username || !password) return c.json({ error: 'Missing fields' }, 400);

    // Simple password hashing (In prod use bcrypt, but for Worker simple hash or WebCrypto)
    // detailed impl later
    const password_hash = password; // Placeholder

    try {
        const { success } = await c.env.DB.prepare(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)'
        ).bind(username, password_hash).run();
        return c.json({ success });
    } catch (e) {
        return c.json({ error: 'Username taken' }, 409);
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

    // TODO: Return JWT
    return c.json({ token: 'fake-jwt-token', user: { id: user.id, username: user.username, role: user.role } });
});

// --- Posts Routes ---
app.get('/api/messages', async (c) => {
    const { results } = await c.env.DB.prepare(
        `SELECT m.*, u.username, 
     (SELECT COUNT(*) FROM comments WHERE message_id = m.id) as comment_count,
     (SELECT COUNT(*) FROM likes WHERE target_type = 'message' AND target_id = m.id) as like_count
     FROM messages m 
     LEFT JOIN users u ON m.user_id = u.id 
     ORDER BY m.created_at DESC LIMIT 50`
    ).all();
    return c.json(results);
});

app.post('/api/messages', async (c) => {
    const { content, nickname, user_id } = await c.req.json(); // user_id from token in real impl

    if (!content) return c.json({ error: 'Content required' }, 400);

    const res = await c.env.DB.prepare(
        'INSERT INTO messages (content, nickname, user_id) VALUES (?, ?, ?)'
    ).bind(content, nickname || 'Anonymous', user_id || null).run();

    return c.json({ success: true, id: res.meta.last_row_id });
});

// --- Comments & Likes ---
// Placeholders for now
app.post('/api/messages/:id/comments', async (c) => {
    // ...
    return c.json({ success: true });
});

export default app;
