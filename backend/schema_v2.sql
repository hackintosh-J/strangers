-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user', -- 'admin', 'user'
  avatar_url TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Messages Table (Existing but enhanced)
-- Note: We might need to migrate existing data or dropping tables. For now creating new structure.
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, -- Nullable for anonymous or linked to legacy
  content TEXT NOT NULL,
  nickname TEXT, -- Legacy support or override
  created_at INTEGER DEFAULT (unixepoch()),
  view_count INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  user_id INTEGER,
  content TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Likes Table (Polymorphic-ish or just for posts for now)
CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_type TEXT NOT NULL, -- 'message', 'comment'
  target_id INTEGER NOT NULL,
  user_id INTEGER, -- Nullable for anonymous likes if we allow them
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(target_type, target_id, user_id)
);
