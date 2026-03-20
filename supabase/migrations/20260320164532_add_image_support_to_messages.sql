/*
  # Add image support to messages

  1. Changes
    - `messages` table: add `image_url` column (nullable text) to store URLs of uploaded images
  
  2. Notes
    - Only math sessions will use this column
    - Images are stored in Supabase Storage and the URL is saved here
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN image_url text;
  END IF;
END $$;
