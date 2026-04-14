/*
  # Add Profile Features

  1. New Tables
    - `contact_notes`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key to contacts)
      - `user_id` (uuid, foreign key to profiles)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `contact_activities`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key to contacts)
      - `user_id` (uuid, foreign key to profiles)
      - `activity_type` (text) - call, email, message, meeting, other
      - `description` (text)
      - `activity_date` (timestamptz)
      - `created_at` (timestamptz)
    
    - `contact_opportunities`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key to contacts)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `amount` (numeric)
      - `currency` (text)
      - `status` (text) - prospect, negotiation, won, lost
      - `probability` (integer) - 0-100
      - `expected_close_date` (date)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Modifications
    - Add `rating` column to contacts table (1-5 stars)
    - Add `notes_count` column to contacts for quick display
    - Add `last_activity_date` column to contacts

  3. Storage
    - Create storage bucket for contact profile photos

  4. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
*/

-- Add rating column to contacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'rating'
  ) THEN
    ALTER TABLE contacts ADD COLUMN rating integer CHECK (rating >= 0 AND rating <= 5) DEFAULT 0;
  END IF;
END $$;

-- Add notes_count column to contacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'notes_count'
  ) THEN
    ALTER TABLE contacts ADD COLUMN notes_count integer DEFAULT 0;
  END IF;
END $$;

-- Add last_activity_date column to contacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'last_activity_date'
  ) THEN
    ALTER TABLE contacts ADD COLUMN last_activity_date timestamptz;
  END IF;
END $$;

-- Create contact_notes table
CREATE TABLE IF NOT EXISTS contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contact notes"
  ON contact_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own contact notes"
  ON contact_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contact notes"
  ON contact_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contact notes"
  ON contact_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create contact_activities table
CREATE TABLE IF NOT EXISTS contact_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('call', 'email', 'message', 'meeting', 'other')),
  description text,
  activity_date timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE contact_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contact activities"
  ON contact_activities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own contact activities"
  ON contact_activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contact activities"
  ON contact_activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contact activities"
  ON contact_activities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create contact_opportunities table
CREATE TABLE IF NOT EXISTS contact_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  amount numeric(12, 2),
  currency text DEFAULT 'EUR',
  status text NOT NULL CHECK (status IN ('prospect', 'negotiation', 'won', 'lost')) DEFAULT 'prospect',
  probability integer CHECK (probability >= 0 AND probability <= 100) DEFAULT 50,
  expected_close_date date,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE contact_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contact opportunities"
  ON contact_opportunities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own contact opportunities"
  ON contact_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contact opportunities"
  ON contact_opportunities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contact opportunities"
  ON contact_opportunities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_user_id ON contact_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_created_at ON contact_notes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_activities_contact_id ON contact_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_activities_user_id ON contact_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_activities_activity_date ON contact_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_contact_activities_type ON contact_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_contact_opportunities_contact_id ON contact_opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_opportunities_user_id ON contact_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_opportunities_status ON contact_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_contacts_rating ON contacts(rating);
CREATE INDEX IF NOT EXISTS idx_contacts_last_activity_date ON contacts(last_activity_date DESC);

-- Create function to update notes_count
CREATE OR REPLACE FUNCTION update_contact_notes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE contacts SET notes_count = notes_count + 1 WHERE id = NEW.contact_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE contacts SET notes_count = GREATEST(0, notes_count - 1) WHERE id = OLD.contact_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notes_count
DROP TRIGGER IF EXISTS trigger_update_notes_count ON contact_notes;
CREATE TRIGGER trigger_update_notes_count
AFTER INSERT OR DELETE ON contact_notes
FOR EACH ROW EXECUTE FUNCTION update_contact_notes_count();

-- Create function to update last_activity_date
CREATE OR REPLACE FUNCTION update_last_activity_date()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts SET last_activity_date = NEW.activity_date WHERE id = NEW.contact_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last_activity_date
DROP TRIGGER IF EXISTS trigger_update_last_activity ON contact_activities;
CREATE TRIGGER trigger_update_last_activity
AFTER INSERT ON contact_activities
FOR EACH ROW EXECUTE FUNCTION update_last_activity_date();

-- Create storage bucket for contact avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-avatars', 'contact-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for contact avatars
CREATE POLICY "Users can upload contact avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contact-avatars');

CREATE POLICY "Users can update contact avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'contact-avatars');

CREATE POLICY "Users can delete contact avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'contact-avatars');

CREATE POLICY "Anyone can view contact avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'contact-avatars');
