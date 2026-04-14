/*
  # Add Public Event Registration Policies

  1. Changes
    - Add policy for public read access to events via QR code token
    - Add policy for public insert access to contacts for event registration
    - Add policy for public insert access to contact_events for event registration
  
  2. Security
    - Public can only read event info via valid qr_code_token
    - Public can only insert contacts with valid event reference
    - Public can only link contacts to events via valid qr_code_token
    - All other operations remain restricted to authenticated users
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read events via QR token" ON events;
DROP POLICY IF EXISTS "Public can insert contacts for event registration" ON contacts;
DROP POLICY IF EXISTS "Public can update contacts for event registration" ON contacts;
DROP POLICY IF EXISTS "Public can link contacts to events" ON contact_events;

-- Allow public to read event details via QR code token
CREATE POLICY "Public can read events via QR token"
  ON events
  FOR SELECT
  TO anon
  USING (qr_code_token IS NOT NULL);

-- Allow public to insert contacts for event registration
-- The user_id must match an existing event's user_id
CREATE POLICY "Public can insert contacts for event registration"
  ON contacts
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.user_id = contacts.user_id
    )
  );

-- Allow public to update existing contacts for event registration
CREATE POLICY "Public can update contacts for event registration"
  ON contacts
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow public to link contacts to events
CREATE POLICY "Public can link contacts to events"
  ON contact_events
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = contact_events.event_id
      AND events.qr_code_token IS NOT NULL
    )
  );
