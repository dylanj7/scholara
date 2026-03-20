/*
  # Make messages column nullable in sessions table

  The sessions.messages column previously had a NOT NULL constraint
  which prevented session creation (messages are only saved when the
  session ends). This removes that constraint.
*/

ALTER TABLE sessions ALTER COLUMN messages DROP NOT NULL;
