/*
  # Remove duplicate notification trigger

  ## Overview
  This migration removes the old `notify_contact_registered` trigger and function
  which was creating incorrect notifications for all contact-event associations,
  regardless of whether they were manual or via QR code.

  ## Problem
  Two triggers existed on the contact_events table:
  1. `on_contact_registered` - old trigger that always created QR notifications
  2. `on_event_contact_registered` - new trigger that checks source field
  
  This caused duplicate and incorrect notifications when manually adding contacts.

  ## Changes
  1. Drop the old `on_contact_registered` trigger
  2. Drop the old `notify_contact_registered()` function
  3. Keep only `on_event_contact_registered` which properly checks the source field

  ## Result
  - Manual contact additions no longer trigger QR code notifications
  - Only actual QR code registrations create the appropriate notification
*/

-- Drop the old trigger
DROP TRIGGER IF EXISTS on_contact_registered ON contact_events;

-- Drop the old function
DROP FUNCTION IF EXISTS notify_contact_registered();