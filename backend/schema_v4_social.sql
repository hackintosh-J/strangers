-- Social Graph: Follows
CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT (strftime('%s', 'now')),
    UNIQUE(follower_id, following_id)
);

-- Messaging: DMs
CREATE TABLE IF NOT EXISTS direct_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT (strftime('%s', 'now'))
);

-- Users: Add Last Active (Can't easily ALTER ADD COLUMN if specific constraints exist but SQLite supports simple ADD)
-- We will try ALTER TABLE. If it fails due to existing column check, we ignore.
ALTER TABLE users ADD COLUMN last_active_at INTEGER DEFAULT 0;
