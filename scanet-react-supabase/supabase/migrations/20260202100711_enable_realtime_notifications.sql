/*
  # Enable Realtime for Notifications

  ## Description
  This migration enables Supabase Realtime for the notifications table to allow
  real-time notification delivery to users without polling.

  ## Changes
  1. Enable Realtime replication for notifications table
  2. Enable Realtime replication for notification_preferences table

  ## Notes
  - This allows the frontend to subscribe to INSERT events on notifications
  - Users will receive instant notifications without page refresh
  - Realtime connections are filtered by user_id for security
*/

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable realtime for notification_preferences table (for live preference updates)
ALTER PUBLICATION supabase_realtime ADD TABLE notification_preferences;
