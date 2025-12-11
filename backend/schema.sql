DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  nickname TEXT,
  created_at INTEGER,
  likes INTEGER DEFAULT 0
);
