/*
  # Add Event Registration Notification Trigger

  ## Overview
  This migration creates a database trigger that automatically sends a notification
  to the event organizer when a new contact registers via the event QR code.

  ## Changes
  1. New Function
    - `notify_event_contact_registered()` - Trigger function that creates a notification
      when a contact is linked to an event

  2. New Trigger
    - `on_event_contact_registered` - Fires after insert on contact_events table

  ## Security
  - Function executes with SECURITY DEFINER to bypass RLS for notification insertion
  - Only fires for new contact-event associations
  - Automatically fetches contact and event details for notification content
  - Creates notification only if event organizer exists

  ## Notes
  - Notifications are created server-side, bypassing client authentication requirements
  - Event organizer receives real-time notification when someone registers via QR
  - Handles NULL values gracefully
*/

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_event_contact_registered ON contact_events;
DROP FUNCTION IF EXISTS notify_event_contact_registered();

-- Create function to send notification when contact registers for event
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
        'event_name', v_event_name
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

-- Create trigger on contact_events table
CREATE TRIGGER on_event_contact_registered
  AFTER INSERT ON contact_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_contact_registered();