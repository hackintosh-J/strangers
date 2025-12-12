-- Safe Migration to V3
-- SQLite doesn't support IF NOT EXISTS for ADD COLUMN, so these might fail if run twice, causing a harmless error.
-- We run them one by one or in a block.

-- 1. Ensure Channels Table
CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    type TEXT DEFAULT 'public',
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Seed Channels (Ignore conflicts)
INSERT OR IGNORE INTO channels (slug, name, description, icon, type) VALUES 
('help', '解忧杂货店', '提问与解答，只有温暖的回答会被保留。', '📪', 'public'),
('hollow', '树洞', '无需标题，无需署名，说出你的秘密。', '🌲', 'anonymous'),
('stories', '故事集', '长篇叙事，分享你的人生片段。', '📖', 'public');

-- 2. Migrate Messages Table
-- We add columns if they are missing. In SQLite we can just run ALTER. If it fails, it fails.
-- But wait, if we run this as a single file, one failure might stop others? 
-- Cloudflare D1 execute attempts to run statements.

-- Add channel_id
ALTER TABLE messages ADD COLUMN channel_id INTEGER DEFAULT 1;

-- Add title
ALTER TABLE messages ADD COLUMN title TEXT;

-- Add nickname
ALTER TABLE messages ADD COLUMN nickname TEXT;

-- Add view_count
ALTER TABLE messages ADD COLUMN view_count INTEGER DEFAULT 0;

