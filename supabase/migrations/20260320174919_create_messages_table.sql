/*
  # Create messages table

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to sessions)
      - `role` (text) - 'student' or 'assistant'
      - `content` (text)
      - `image_url` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on messages table
    - Allow anonymous insert and select (public educational tool)
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('student', 'assistant')),
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert on messages"
  ON messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select on messages"
  ON messages FOR SELECT
  TO anon
  USING (true);
