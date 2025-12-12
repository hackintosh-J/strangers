-- Ensure channels table exists
CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    type TEXT DEFAULT 'public',
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Insert or Ignore seed data
INSERT OR IGNORE INTO channels (slug, name, description, icon, type) VALUES 
('help', '解忧杂货店', '提问与解答，只有温暖的回答会被保留。', '📪', 'public'),
('hollow', '树洞', '无需标题，无需署名，说出你的秘密。', '🌲', 'anonymous'),
('stories', '故事集', '长篇叙事，分享你的人生片段。', '📖', 'public');
