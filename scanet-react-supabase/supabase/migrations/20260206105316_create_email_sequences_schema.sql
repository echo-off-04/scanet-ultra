/*
  # Create Email Sequences Automation Schema

  1. New Tables
    - `email_sequences` - Automated email sequence templates
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Sequence name
      - `description` (text) - Description
      - `trigger_status` (text) - Contact status that triggers this sequence
      - `source_filter` (text) - Optional source filter
      - `exclude_statuses` (text[]) - Relationship types to exclude
      - `is_active` (boolean) - Whether sequence is active

    - `email_sequence_steps` - Individual steps within a sequence
      - `id` (uuid, primary key)
      - `sequence_id` (uuid, references email_sequences)
      - `step_order` (integer) - Order of this step
      - `delay_days` / `delay_hours` (integer) - Cumulative delay from enrollment
      - `subject` / `body` (text) - Email content with variable support
      - `channel` (text) - email or whatsapp
      - `include_offer_id` (uuid, nullable) - Optional offer to include

    - `email_sequence_enrollments` - Tracks contacts enrolled in sequences
      - `id` (uuid, primary key)
      - `sequence_id`, `contact_id`, `user_id` - Foreign keys
      - `current_step` (integer) - Current step index
      - `status` (text) - active, completed, paused, cancelled
      - `trigger_context` (jsonb) - Context data for personalization

    - `email_sequence_sends` - Individual step execution records
      - `id` (uuid, primary key)
      - `enrollment_id`, `step_id` - Foreign keys
      - `status` (text) - pending, sent, failed, skipped
      - `scheduled_for` (timestamptz) - When to send

  2. Security
    - RLS enabled on all tables
    - Users can only access their own data

  3. Triggers
    - Auto-enroll contacts in matching sequences on contact INSERT
    - Auto-schedule step sends when a new enrollment is created

  4. Template variables
    - {{prenom}}, {{nom_complet}}, {{entreprise}}, {{evenement}}, {{date_rencontre}}, {{source}}, {{mon_nom}}
*/

CREATE TABLE IF NOT EXISTS email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  trigger_status text NOT NULL,
  source_filter text,
  exclude_statuses text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own sequences"
  ON email_sequences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sequences"
  ON email_sequences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sequences"
  ON email_sequences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sequences"
  ON email_sequences FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER set_email_sequences_updated_at
  BEFORE UPDATE ON email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS email_sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES email_sequences(id) ON DELETE CASCADE NOT NULL,
  step_order integer NOT NULL DEFAULT 1,
  delay_days integer NOT NULL DEFAULT 0,
  delay_hours integer NOT NULL DEFAULT 0,
  subject text NOT NULL,
  body text NOT NULL,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp')),
  include_offer_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own sequence steps"
  ON email_sequence_steps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = email_sequence_steps.sequence_id AND email_sequences.user_id = auth.uid()));

CREATE POLICY "Users can insert own sequence steps"
  ON email_sequence_steps FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = email_sequence_steps.sequence_id AND email_sequences.user_id = auth.uid()));

CREATE POLICY "Users can update own sequence steps"
  ON email_sequence_steps FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = email_sequence_steps.sequence_id AND email_sequences.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = email_sequence_steps.sequence_id AND email_sequences.user_id = auth.uid()));

CREATE POLICY "Users can delete own sequence steps"
  ON email_sequence_steps FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = email_sequence_steps.sequence_id AND email_sequences.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES email_sequences(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_step integer DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  trigger_context jsonb DEFAULT '{}',
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(sequence_id, contact_id)
);

ALTER TABLE email_sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own enrollments"
  ON email_sequence_enrollments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollments"
  ON email_sequence_enrollments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments"
  ON email_sequence_enrollments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own enrollments"
  ON email_sequence_enrollments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS email_sequence_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES email_sequence_enrollments(id) ON DELETE CASCADE NOT NULL,
  step_id uuid REFERENCES email_sequence_steps(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  error_message text,
  email_log_id uuid REFERENCES email_logs(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_sequence_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own sequence sends"
  ON email_sequence_sends FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM email_sequence_enrollments WHERE email_sequence_enrollments.id = email_sequence_sends.enrollment_id AND email_sequence_enrollments.user_id = auth.uid()));

CREATE POLICY "Users can insert own sequence sends"
  ON email_sequence_sends FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM email_sequence_enrollments WHERE email_sequence_enrollments.id = email_sequence_sends.enrollment_id AND email_sequence_enrollments.user_id = auth.uid()));

CREATE POLICY "Users can update own sequence sends"
  ON email_sequence_sends FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM email_sequence_enrollments WHERE email_sequence_enrollments.id = email_sequence_sends.enrollment_id AND email_sequence_enrollments.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM email_sequence_enrollments WHERE email_sequence_enrollments.id = email_sequence_sends.enrollment_id AND email_sequence_enrollments.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_email_sequences_user_active ON email_sequences(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_email_sequence_steps_sequence ON email_sequence_steps(sequence_id, step_order);
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_sequence ON email_sequence_enrollments(sequence_id, status);
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_contact ON email_sequence_enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_sends_status ON email_sequence_sends(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_sequence_sends_enrollment ON email_sequence_sends(enrollment_id);

CREATE OR REPLACE FUNCTION auto_enroll_contact_in_sequences()
RETURNS TRIGGER AS $$
DECLARE
  seq RECORD;
  event_name text;
  event_date text;
BEGIN
  event_name := NULL;
  event_date := NULL;

  IF NEW.source = 'event' THEN
    SELECT e.name, to_char(e.start_date, 'DD/MM/YYYY')
    INTO event_name, event_date
    FROM contact_events ce
    JOIN events e ON e.id = ce.event_id
    WHERE ce.contact_id = NEW.id
    ORDER BY ce.created_at DESC
    LIMIT 1;
  END IF;

  FOR seq IN
    SELECT id FROM email_sequences
    WHERE user_id = NEW.user_id
      AND is_active = true
      AND trigger_status = NEW.status
      AND (source_filter IS NULL OR source_filter = NEW.source)
      AND NOT (NEW.status = ANY(exclude_statuses))
  LOOP
    INSERT INTO email_sequence_enrollments (sequence_id, contact_id, user_id, trigger_context)
    VALUES (
      seq.id,
      NEW.id,
      NEW.user_id,
      jsonb_build_object(
        'contact_name', NEW.full_name,
        'contact_email', COALESCE(NEW.email, ''),
        'contact_phone', COALESCE(NEW.phone, ''),
        'contact_company', COALESCE(NEW.company, ''),
        'source', COALESCE(NEW.source, ''),
        'event_name', COALESCE(event_name, ''),
        'event_date', COALESCE(event_date, '')
      )
    )
    ON CONFLICT (sequence_id, contact_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER contact_auto_enroll_sequences
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION auto_enroll_contact_in_sequences();

CREATE OR REPLACE FUNCTION schedule_sequence_step_sends()
RETURNS TRIGGER AS $$
DECLARE
  step RECORD;
  cumulative_interval interval;
BEGIN
  cumulative_interval := interval '0';

  FOR step IN
    SELECT * FROM email_sequence_steps
    WHERE sequence_id = NEW.sequence_id
    ORDER BY step_order ASC
  LOOP
    cumulative_interval := cumulative_interval
      + (step.delay_days || ' days')::interval
      + (step.delay_hours || ' hours')::interval;

    INSERT INTO email_sequence_sends (enrollment_id, step_id, status, scheduled_for)
    VALUES (NEW.id, step.id, 'pending', NEW.enrolled_at + cumulative_interval);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enrollment_schedule_sends
  AFTER INSERT ON email_sequence_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION schedule_sequence_step_sends();
