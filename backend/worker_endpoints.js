// ... (Previous code)

// --- Comments & Likes ---

// Toggle Like
app.post('/api/messages/:id/like', authMiddleware, async (c) => {
    const messageId = c.req.param('id');
    const user = c.get('jwtPayload');

    // Check if already liked
    const existing = await c.env.DB.prepare(
        "SELECT id FROM likes WHERE target_type = 'message' AND target_id = ? AND user_id = ?"
    ).bind(messageId, user.id).first();

    if (existing) {
        // Unlike
        await c.env.DB.prepare(
            "DELETE FROM likes WHERE id = ?"
        ).bind(existing.id).run();
        return c.json({ liked: false });
    } else {
        // Like
        await c.env.DB.prepare(
            "INSERT INTO likes (target_type, target_id, user_id) VALUES ('message', ?, ?)"
        ).bind(messageId, user.id).run();
        return c.json({ liked: true });
    }
});

// Get Comments
app.get('/api/messages/:id/comments', async (c) => {
    const id = c.req.param('id');
    const { results } = await c.env.DB.prepare(
        `SELECT c.*, u.username FROM comments c 
         LEFT JOIN users u ON c.user_id = u.id 
         WHERE message_id = ? ORDER BY c.created_at ASC`
    ).bind(id).all();
    return c.json(results);
});

// Post Comment
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

// Update Delete to allow Owner
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

export default app;
