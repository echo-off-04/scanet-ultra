/*
  # Add Offer Email Tracking
  
  ## New Columns
  
  1. offer_sends table additions:
    - `email_log_id` (uuid, FK) - Reference to email_logs for tracking
    - `email_sent_at` (timestamptz) - When the email was sent
    - `email_opened_at` (timestamptz) - When the email was opened
    - `email_clicked_at` (timestamptz) - When any link was clicked
    - `offer_status` (text) - Status: pending, viewed, accepted, declined
    - `responded_at` (timestamptz) - When recipient responded
    - `tracking_token` (text, unique) - Unique token for tracking opens/clicks
    - `attachments` (jsonb) - Array of attached files (PDFs)
    
  2. email_logs table additions:
    - `opened_at` (timestamptz) - When the email was opened
    - `clicked_at` (timestamptz) - When any link was clicked
    - `tracking_token` (text, unique) - Unique token for tracking
    - `click_count` (integer) - Number of clicks
    - `open_count` (integer) - Number of opens
    
  ## Security
  - RLS policies for tracking endpoints (public read for tracking pixels)
  - Indexes for performance
*/

-- Add tracking columns to email_logs
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS opened_at timestamptz;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS clicked_at timestamptz;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS tracking_token text UNIQUE;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS click_count integer DEFAULT 0;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS open_count integer DEFAULT 0;

-- Add tracking and status columns to offer_sends
ALTER TABLE offer_sends ADD COLUMN IF NOT EXISTS email_log_id uuid REFERENCES email_logs(id);
ALTER TABLE offer_sends ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;
ALTER TABLE offer_sends ADD COLUMN IF NOT EXISTS email_opened_at timestamptz;
ALTER TABLE offer_sends ADD COLUMN IF NOT EXISTS email_clicked_at timestamptz;
ALTER TABLE offer_sends ADD COLUMN IF NOT EXISTS offer_status text DEFAULT 'pending' CHECK (offer_status IN ('pending', 'viewed', 'accepted', 'declined'));
ALTER TABLE offer_sends ADD COLUMN IF NOT EXISTS responded_at timestamptz;
ALTER TABLE offer_sends ADD COLUMN IF NOT EXISTS tracking_token text UNIQUE;
ALTER TABLE offer_sends ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_tracking_token ON email_logs(tracking_token);
CREATE INDEX IF NOT EXISTS idx_offer_sends_tracking_token ON offer_sends(tracking_token);
CREATE INDEX IF NOT EXISTS idx_offer_sends_email_log_id ON offer_sends(email_log_id);
CREATE INDEX IF NOT EXISTS idx_offer_sends_offer_status ON offer_sends(offer_status);

-- Function to update email tracking
CREATE OR REPLACE FUNCTION update_email_tracking(
  token text,
  event_type text -- 'open' or 'click'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  log_id uuid;
  result jsonb;
BEGIN
  -- Update email_logs
  UPDATE email_logs
  SET 
    opened_at = CASE 
      WHEN event_type = 'open' AND opened_at IS NULL THEN now()
      ELSE opened_at
    END,
    clicked_at = CASE 
      WHEN event_type = 'click' AND clicked_at IS NULL THEN now()
      ELSE clicked_at
    END,
    open_count = CASE 
      WHEN event_type = 'open' THEN open_count + 1
      ELSE open_count
    END,
    click_count = CASE 
      WHEN event_type = 'click' THEN click_count + 1
      ELSE click_count
    END
  WHERE tracking_token = token
  RETURNING id INTO log_id;
  
  -- Update offer_sends if exists
  UPDATE offer_sends
  SET 
    email_opened_at = CASE 
      WHEN event_type = 'open' AND email_opened_at IS NULL THEN now()
      ELSE email_opened_at
    END,
    email_clicked_at = CASE 
      WHEN event_type = 'click' AND email_clicked_at IS NULL THEN now()
      ELSE email_clicked_at
    END,
    offer_status = CASE 
      WHEN event_type = 'open' AND offer_status = 'pending' THEN 'viewed'
      ELSE offer_status
    END
  WHERE tracking_token = token;
  
  result := jsonb_build_object(
    'success', true,
    'event', event_type,
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;

-- Function to update offer status (accept/decline)
CREATE OR REPLACE FUNCTION update_offer_status(
  token text,
  new_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  send_record RECORD;
  creator_id uuid;
  result jsonb;
BEGIN
  -- Update offer status
  UPDATE offer_sends
  SET 
    offer_status = new_status,
    responded_at = now()
  WHERE tracking_token = token
  RETURNING user_id, offer_id, pack_id INTO send_record;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid token');
  END IF;
  
  -- Create notification for offer creator
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    metadata
  )
  VALUES (
    send_record.user_id,
    'offer_response',
    CASE 
      WHEN new_status = 'accepted' THEN 'Offre acceptée'
      WHEN new_status = 'declined' THEN 'Offre refusée'
      ELSE 'Réponse à votre offre'
    END,
    CASE 
      WHEN new_status = 'accepted' THEN 'Un contact a accepté votre offre'
      WHEN new_status = 'declined' THEN 'Un contact a refusé votre offre'
      ELSE 'Un contact a répondu à votre offre'
    END,
    jsonb_build_object(
      'offer_id', send_record.offer_id,
      'pack_id', send_record.pack_id,
      'status', new_status,
      'tracking_token', token
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'status', new_status
  );
  
  RETURN result;
END;
$$;

-- Public policy for tracking (anyone with token can update)
CREATE POLICY "Public can track emails"
  ON email_logs FOR UPDATE
  TO anon, authenticated
  USING (tracking_token IS NOT NULL)
  WITH CHECK (tracking_token IS NOT NULL);

-- Public policy for offer status updates
CREATE POLICY "Public can update offer status with token"
  ON offer_sends FOR UPDATE
  TO anon, authenticated
  USING (tracking_token IS NOT NULL)
  WITH CHECK (tracking_token IS NOT NULL);
