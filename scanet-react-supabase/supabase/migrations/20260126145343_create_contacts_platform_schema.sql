/*
  # Create Contacts Networking Platform Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users, primary key)
      - `email` (text)
      - `full_name` (text)
      - `company` (text)
      - `job_title` (text)
      - `avatar_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `contacts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `full_name` (text, required)
      - `email` (text)
      - `phone` (text)
      - `company` (text)
      - `job_title` (text)
      - `linkedin_url` (text)
      - `avatar_url` (text)
      - `rating` (integer, 1-5 stars)
      - `tags` (text array)
      - `notes` (text)
      - `status` (text: lead, prospect, client, partner)
      - `source` (text: event, referral, cold_outreach)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text, required)
      - `event_type` (text: salon, meeting, conference, networking)
      - `location` (text)
      - `event_date` (date)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `contact_events`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, references contacts)
      - `event_id` (uuid, references events)
      - `created_at` (timestamptz)
    
    - `interactions`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, references contacts)
      - `user_id` (uuid, references profiles)
      - `interaction_type` (text: call, email, meeting, note)
      - `subject` (text)
      - `description` (text)
      - `interaction_date` (timestamptz)
      - `created_at` (timestamptz)
    
    - `follow_ups`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, references contacts)
      - `user_id` (uuid, references profiles)
      - `title` (text, required)
      - `description` (text)
      - `due_date` (timestamptz)
      - `completed` (boolean, default false)
      - `priority` (text: low, medium, high)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own contacts, events, interactions, and follow-ups
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  company text,
  job_title text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  company text,
  job_title text,
  linkedin_url text,
  avatar_url text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  tags text[] DEFAULT '{}',
  notes text,
  status text DEFAULT 'lead' CHECK (status IN ('lead', 'prospect', 'client', 'partner')),
  source text CHECK (source IN ('event', 'referral', 'cold_outreach')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  event_type text DEFAULT 'networking' CHECK (event_type IN ('salon', 'meeting', 'conference', 'networking')),
  location text,
  event_date date,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create contact_events junction table
CREATE TABLE IF NOT EXISTS contact_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contact_id, event_id)
);

ALTER TABLE contact_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contact events"
  ON contact_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_events.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own contact events"
  ON contact_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_events.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own contact events"
  ON contact_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_events.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

-- Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  interaction_type text DEFAULT 'note' CHECK (interaction_type IN ('call', 'email', 'meeting', 'note')),
  subject text,
  description text,
  interaction_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interactions"
  ON interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions"
  ON interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interactions"
  ON interactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions"
  ON interactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create follow_ups table
CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  completed boolean DEFAULT false,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follow-ups"
  ON follow_ups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own follow-ups"
  ON follow_ups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own follow-ups"
  ON follow_ups FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own follow-ups"
  ON follow_ups FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_contact_id ON follow_ups(contact_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user_id ON follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON follow_ups(due_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_completed ON follow_ups(completed);