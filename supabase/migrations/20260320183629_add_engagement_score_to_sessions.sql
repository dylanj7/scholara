/*
  # Add engagement_score to sessions table

  1. Modified Tables
    - `sessions`
      - `engagement_score` (integer, nullable) — score from 1-10 calculated at session end
        based on student message count, average message length, and use of shortcut phrases

  2. Notes
    - Column is nullable so existing sessions without a score are unaffected
    - Score is computed client-side and written when the session ends
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'engagement_score'
  ) THEN
    ALTER TABLE sessions ADD COLUMN engagement_score integer;
  END IF;
END $$;
