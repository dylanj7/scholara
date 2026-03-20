/*
  # Add messages JSON and duration to sessions table

  1. Modified Tables
    - `sessions`
      - `messages` (jsonb) - Full conversation array stored as JSON, each item has role and content
      - `duration` (integer) - Session duration in seconds from start to end

  2. Notes
    - Both columns are nullable so existing sessions are not affected
    - messages column stores the complete chat history for easy retrieval without joining
    - duration is computed client-side and stored on session end
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'messages'
  ) THEN
    ALTER TABLE sessions ADD COLUMN messages jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'duration'
  ) THEN
    ALTER TABLE sessions ADD COLUMN duration integer;
  END IF;
END $$;
