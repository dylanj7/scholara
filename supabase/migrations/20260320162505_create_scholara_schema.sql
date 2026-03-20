/*
  # Scholara Database Schema

  1. New Tables
    - `sessions`
      - `id` (uuid, primary key) - Unique session identifier
      - `student_name` (text) - Student's first name
      - `subject` (text) - Selected subject (Essay Writing or Mathematics)
      - `started_at` (timestamptz) - Session start time
      - `ended_at` (timestamptz) - Session end time (nullable, set when session ends)
      - `created_at` (timestamptz) - Record creation timestamp
    
    - `messages`
      - `id` (uuid, primary key) - Unique message identifier
      - `session_id` (uuid, foreign key) - Reference to session
      - `role` (text) - Message sender role (student or assistant)
      - `content` (text) - Message content
      - `created_at` (timestamptz) - Message timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for anonymous access (public educational tool)
*/

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  subject text NOT NULL CHECK (subject IN ('Essay Writing', 'Mathematics')),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('student', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert on sessions"
  ON sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select on sessions"
  ON sessions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous update on sessions"
  ON sessions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous insert on messages"
  ON messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select on messages"
  ON messages FOR SELECT
  TO anon
  USING (true);
