/*
  # Create Notifications Schema

  ## Overview
  This migration creates a comprehensive notification system with two main tables:
  - notifications: Stores user notifications with categories, priorities, and metadata
  - notification_preferences: User preferences for notification delivery and types

  ## New Tables

  ### notifications
  Stores all notifications for users with flexible metadata support
  - `id` (uuid, primary key) - Unique notification identifier
  - `user_id` (uuid, foreign key) - References auth.users(id)
  - `type` (text) - Specific notification type (e.g., 'contact_added', 'opportunity_won')
  - `category` (text) - Category grouping (contacts, opportunities, follow_ups, events, team_activity, system)
  - `title` (text) - Short notification title
  - `message` (text) - Detailed notification message
  - `action_url` (text, nullable) - Optional URL to navigate when notification is clicked
  - `read` (boolean) - Whether notification has been read
  - `priority` (text) - Priority level (low, medium, high, urgent)
  - `metadata` (jsonb, nullable) - Flexible JSON storage for additional context
  - `expires_at` (timestamptz, nullable) - Optional expiration date for temporary notifications
  - `created_at` (timestamptz) - Timestamp of notification creation

  ### notification_preferences
  User preferences for notification delivery and filtering
  - `id` (uuid, primary key) - Unique preference record identifier
  - `user_id` (uuid, foreign key) - References auth.users(id)
  - `contacts_enabled` (boolean) - Enable/disable contact notifications
  - `opportunities_enabled` (boolean) - Enable/disable opportunity notifications
  - `reminders_enabled` (boolean) - Enable/disable reminder notifications
  - `team_activity_enabled` (boolean) - Enable/disable team activity notifications
  - `quiet_hours_enabled` (boolean) - Enable/disable quiet hours feature
  - `quiet_hours_start` (time, nullable) - Start time for quiet hours
  - `quiet_hours_end` (time, nullable) - End time for quiet hours
  - `email_digest` (text) - Email digest frequency (never, daily, weekly)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Indexes
  - Index on `user_id` for fast user-specific queries
  - Index on `read` status for filtering unread notifications
  - Combined index on `user_id` and `read` for efficient unread count queries
  - Index on `created_at` for time-based sorting
  - Index on `expires_at` for cleanup queries

  ## Security
  - Enable RLS on both tables
  - Users can only view their own notifications
  - Users can only update their own notifications (mark as read)
  - Users can only delete their own notifications
  - Users can only view and update their own preferences
  - System can insert notifications for any user (for scheduled notifications)

  ## Notes
  - Notifications support flexible metadata via JSONB for extensibility
  - Categories align with main application domains
  - Priority levels enable urgent notification handling
  - Action URLs enable deep linking to relevant resources
  - Expiration support allows automatic cleanup of temporary notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  category text NOT NULL CHECK (category IN ('contacts', 'opportunities', 'follow_ups', 'events', 'team_activity', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  read boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  metadata jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  contacts_enabled boolean NOT NULL DEFAULT true,
  opportunities_enabled boolean NOT NULL DEFAULT true,
  reminders_enabled boolean NOT NULL DEFAULT true,
  team_activity_enabled boolean NOT NULL DEFAULT true,
  quiet_hours_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_start time,
  quiet_hours_end time,
  email_digest text NOT NULL DEFAULT 'daily' CHECK (email_digest IN ('never', 'daily', 'weekly')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Notification preferences policies
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_notification_preferences_timestamp ON notification_preferences;
CREATE TRIGGER update_notification_preferences_timestamp
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();