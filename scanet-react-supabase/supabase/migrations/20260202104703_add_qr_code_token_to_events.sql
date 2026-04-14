/*
  # Add QR Code Token to Events

  1. Changes
    - Add `qr_code_token` column to `events` table
      - UUID type with unique constraint
      - Auto-generated default value using gen_random_uuid()
      - Used for public QR code access to event registration
    
  2. Security
    - Token is unique and auto-generated
    - Allows public access to event registration without exposing event ID
*/

-- Add qr_code_token column to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'qr_code_token'
  ) THEN
    ALTER TABLE events ADD COLUMN qr_code_token uuid UNIQUE DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_qr_code_token ON events(qr_code_token);
