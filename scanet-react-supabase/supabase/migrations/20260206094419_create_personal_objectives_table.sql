/*
  # Create Personal Objectives Table

  ## Overview
  Creates a table for personal user objectives that are automatically tracked
  against real-time platform data (KPIs).

  ## New Tables
  1. `personal_objectives`
    - `id` (uuid, primary key) - Unique identifier
    - `user_id` (uuid, FK to auth.users) - Owner of the objective
    - `objective_type` (text) - Type of KPI tracked:
      - 'revenue' = Sum of won opportunities
      - 'new_contacts' = New contacts added in period
      - 'contacts_by_status' = Contacts of a specific status in period
      - 'win_rate' = Opportunity win rate percentage
      - 'participation_rate' = Event participation rate
    - `title` (text) - User-defined title for the objective
    - `description` (text) - Optional description
    - `target_value` (numeric) - Target value to reach
    - `current_value` (numeric) - Auto-calculated current value
    - `unit` (text) - Unit of measurement (currency, number, percentage)
    - `currency` (varchar) - Currency code when unit is currency
    - `contact_status_filter` (text) - For contacts_by_status type, which status to track
    - `period_type` (text) - Period granularity: day, week, month, year, all_time
    - `period_start` (timestamptz) - Start of the tracking period
    - `period_end` (timestamptz) - End of the tracking period
    - `event_id` (uuid, FK to events) - Optional: track objective for a specific event
    - `status` (text) - Objective status: active, achieved, failed, cancelled
    - `achieved_at` (timestamptz) - When the objective was achieved
    - `notified` (boolean) - Whether achievement notification was sent
    - `priority` (text) - Priority: low, medium, high
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on personal_objectives
  - Users can only CRUD their own objectives

  ## Indexes
  - user_id for fast user-specific queries
  - status for filtering active objectives
  - objective_type for filtering by type
*/

CREATE TABLE IF NOT EXISTS personal_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objective_type text NOT NULL CHECK (objective_type IN (
    'revenue', 'new_contacts', 'contacts_by_status', 'win_rate', 'participation_rate'
  )),
  title text NOT NULL,
  description text,
  target_value numeric NOT NULL,
  current_value numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'number' CHECK (unit IN ('currency', 'number', 'percentage')),
  currency varchar(3) DEFAULT 'EUR',
  contact_status_filter text CHECK (contact_status_filter IN (
    'lead', 'prospect', 'client', 'partner', 'collaborateur', 'ami', 'fournisseur'
  )),
  period_type text NOT NULL DEFAULT 'month' CHECK (period_type IN ('day', 'week', 'month', 'year', 'all_time')),
  period_start timestamptz,
  period_end timestamptz,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'failed', 'cancelled')),
  achieved_at timestamptz,
  notified boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE personal_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own personal objectives"
  ON personal_objectives FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own personal objectives"
  ON personal_objectives FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal objectives"
  ON personal_objectives FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own personal objectives"
  ON personal_objectives FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_personal_objectives_user_id ON personal_objectives(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_objectives_status ON personal_objectives(status);
CREATE INDEX IF NOT EXISTS idx_personal_objectives_type ON personal_objectives(objective_type);
CREATE INDEX IF NOT EXISTS idx_personal_objectives_event_id ON personal_objectives(event_id) WHERE event_id IS NOT NULL;

CREATE OR REPLACE FUNCTION update_personal_objectives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_personal_objectives_timestamp ON personal_objectives;
CREATE TRIGGER update_personal_objectives_timestamp
  BEFORE UPDATE ON personal_objectives
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_objectives_updated_at();
