/*
  # Add source field to contact_events and update notification trigger

  ## Overview
  This migration fixes the notification issue where manual contact-event associations
  were triggering QR code registration notifications incorrectly.

  ## Changes
  1. Schema Changes
    - Add `source` field to `contact_events` table to track how the association was created
      - Possible values: 'manual', 'qr_code', 'import'
      - Default: 'manual'
    - Add `created_by` field to track which user created the association

  2. Trigger Updates
    - Modify `notify_event_contact_registered()` function to only create notifications
      when source is 'qr_code'
    - Ignore manual associations to prevent duplicate/incorrect notifications

  ## Security
  - Function continues to execute with SECURITY DEFINER
  - Source field prevents notification spam from manual operations
  - Created_by field helps with audit trails

  ## Notes
  - Existing rows will have source = NULL, which will be treated as manual
  - QR code registrations must explicitly set source = 'qr_code'
  - This prevents duplicate notifications when manually adding contacts to events
*/

-- Add source field to contact_events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_events' AND column_name = 'source'
  ) THEN
    ALTER TABLE contact_events ADD COLUMN source text DEFAULT 'manual' CHECK (source IN ('manual', 'qr_code', 'import'));
  END IF;
END $$;

-- Add created_by field to contact_events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_events' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE contact_events ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Drop and recreate the trigger function with source check
DROP TRIGGER IF EXISTS on_event_contact_registered ON contact_events;
DROP FUNCTION IF EXISTS notify_event_contact_registered();

-- Create updated function that only triggers for QR code registrations
CREATE OR REPLACE FUNCTION notify_event_contact_registered()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_contact_name text;
  v_event_name text;
  v_event_user_id uuid;
BEGIN
  -- Only proceed if this is a QR code registration
  -- This prevents notifications for manual contact-event associations
  IF NEW.source IS NULL OR NEW.source != 'qr_code' THEN
    RETURN NEW;
  END IF;

  -- Get contact details (use email as fallback if name is empty)
  SELECT COALESCE(NULLIF(full_name, ''), email, 'Contact anonyme')
  INTO v_contact_name
  FROM contacts
  WHERE id = NEW.contact_id;

  -- Get event details and organizer
  SELECT name, user_id
  INTO v_event_name, v_event_user_id
  FROM events
  WHERE id = NEW.event_id;

  -- Only create notification if we have all required data
  IF v_event_user_id IS NOT NULL AND v_contact_name IS NOT NULL AND v_event_name IS NOT NULL THEN
    -- Create notification for event organizer
    INSERT INTO notifications (
      user_id,
      type,
      category,
      title,
      message,
      action_url,
      priority,
      metadata
    ) VALUES (
      v_event_user_id,
      'contact_registered_qr',
      'events',
      'Nouveau contact enregistré',
      v_contact_name || ' s''est enregistré via le code QR de l''événement "' || v_event_name || '"',
      '/contacts/' || NEW.contact_id,
      'medium',
      jsonb_build_object(
        'contact_id', NEW.contact_id,
        'contact_name', v_contact_name,
        'event_id', NEW.event_id,
        'event_name', v_event_name,
        'source', 'qr_code'
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the contact registration
    RAISE WARNING 'Failed to create notification for contact registration: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger on contact_events table
CREATE TRIGGER on_event_contact_registered
  AFTER INSERT ON contact_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_contact_registered();