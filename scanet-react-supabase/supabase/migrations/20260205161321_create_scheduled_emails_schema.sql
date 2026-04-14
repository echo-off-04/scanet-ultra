/*
  # Create Scheduled Emails Schema for Follow-up/Relances Feature

  1. New Tables
    - `scheduled_emails`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to profiles) - Creator of the scheduled email
      - `subject` (text) - Email subject line
      - `body` (text) - Email body content (user-defined)
      - `scheduled_for` (timestamptz) - When to send the email
      - `status` (text) - pending, sent, failed, cancelled
      - `sent_at` (timestamptz) - When email was actually sent
      - `error_message` (text) - Error details if failed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `scheduled_email_recipients`
      - `id` (uuid, primary key)
      - `scheduled_email_id` (uuid, FK to scheduled_emails)
      - `contact_id` (uuid, FK to contacts, nullable)
      - `email` (text) - Email address (for flexibility)
      - `status` (text) - pending, sent, failed
      - `sent_at` (timestamptz)
      - `email_log_id` (uuid, FK to email_logs, nullable)
      - `error_message` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Users can only view/manage their own scheduled emails
    - Policies for select, insert, update, delete operations
  
  3. Indexes
    - Index on scheduled_for for efficient querying of pending emails
    - Index on user_id for user-specific queries
    - Index on status for filtering
*/

-- Create scheduled_emails table
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create scheduled_email_recipients table
CREATE TABLE IF NOT EXISTS scheduled_email_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_email_id uuid REFERENCES scheduled_emails(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  email_log_id uuid REFERENCES email_logs(id),
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user_id ON scheduled_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_for ON scheduled_emails(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_email_recipients_scheduled_email_id ON scheduled_email_recipients(scheduled_email_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_email_recipients_contact_id ON scheduled_email_recipients(contact_id);

-- Enable Row Level Security
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_email_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_emails table
CREATE POLICY "Users can view own scheduled emails"
  ON scheduled_emails FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scheduled emails"
  ON scheduled_emails FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled emails"
  ON scheduled_emails FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled emails"
  ON scheduled_emails FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for scheduled_email_recipients table
CREATE POLICY "Users can view recipients of own scheduled emails"
  ON scheduled_email_recipients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_emails
      WHERE scheduled_emails.id = scheduled_email_recipients.scheduled_email_id
      AND scheduled_emails.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create recipients for own scheduled emails"
  ON scheduled_email_recipients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scheduled_emails
      WHERE scheduled_emails.id = scheduled_email_recipients.scheduled_email_id
      AND scheduled_emails.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recipients of own scheduled emails"
  ON scheduled_email_recipients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_emails
      WHERE scheduled_emails.id = scheduled_email_recipients.scheduled_email_id
      AND scheduled_emails.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scheduled_emails
      WHERE scheduled_emails.id = scheduled_email_recipients.scheduled_email_id
      AND scheduled_emails.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete recipients of own scheduled emails"
  ON scheduled_email_recipients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_emails
      WHERE scheduled_emails.id = scheduled_email_recipients.scheduled_email_id
      AND scheduled_emails.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_scheduled_emails_updated_at
  BEFORE UPDATE ON scheduled_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_emails_updated_at();