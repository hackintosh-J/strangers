-- Schema V5: Stickers & Multimedia
CREATE TABLE IF NOT EXISTS stickers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, -- Uploader (NULL for system stickers)
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS user_stickers (
    user_id INTEGER NOT NULL,
    sticker_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT (unixepoch()),
    PRIMARY KEY (user_id, sticker_id)
);

-- Index for quick lookup of user's stickers
CREATE INDEX IF NOT EXISTS idx_user_stickers_user ON user_stickers(user_id);
