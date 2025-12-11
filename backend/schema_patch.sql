-- Patch to add missing columns to existing messages table
ALTER TABLE messages ADD COLUMN user_id INTEGER;
ALTER TABLE messages ADD COLUMN view_count INTEGER DEFAULT 0;
