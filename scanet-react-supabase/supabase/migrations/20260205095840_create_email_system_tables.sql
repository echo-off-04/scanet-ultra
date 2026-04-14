/*
  # Create Email System Tables

  ## Description
  Tables pour gérer l'envoi d'emails via Resend API et les préférences utilisateur.

  ## 1. New Tables

  ### `email_logs`
  - `id` (uuid, primary key) - Identifiant unique
  - `user_id` (uuid) - Utilisateur destinataire
  - `to_email` (text) - Adresse email destinataire
  - `from_email` (text) - Adresse email expéditeur
  - `subject` (text) - Sujet de l'email
  - `template_type` (text) - Type de template utilisé
  - `status` (text) - Statut d'envoi (sent, failed, pending)
  - `resend_id` (text) - ID de l'email chez Resend
  - `error_message` (text, nullable) - Message d'erreur si échec
  - `metadata` (jsonb, nullable) - Métadonnées additionnelles
  - `sent_at` (timestamptz) - Date d'envoi
  - `created_at` (timestamptz) - Date de création

  ### `email_preferences`
  - `id` (uuid, primary key) - Identifiant unique
  - `user_id` (uuid, unique) - Utilisateur
  - `welcome_emails` (boolean) - Recevoir les emails de bienvenue
  - `notification_emails` (boolean) - Recevoir les emails de notification
  - `marketing_emails` (boolean) - Recevoir les emails marketing
  - `opportunity_emails` (boolean) - Recevoir les emails d'opportunités
  - `event_emails` (boolean) - Recevoir les emails d'événements
  - `digest_frequency` (text) - Fréquence du digest (never, daily, weekly)
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Date de mise à jour

  ## 2. Security
  - Enable RLS on both tables
  - Add policies for authenticated users to:
    - Read their own email logs
    - Read and update their own email preferences
*/

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  from_email text NOT NULL DEFAULT 'noreply@yourdomain.com',
  subject text NOT NULL,
  template_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  resend_id text,
  error_message text,
  metadata jsonb,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create email_preferences table
CREATE TABLE IF NOT EXISTS email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  welcome_emails boolean DEFAULT true,
  notification_emails boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  opportunity_emails boolean DEFAULT true,
  event_emails boolean DEFAULT true,
  digest_frequency text DEFAULT 'daily' CHECK (digest_frequency IN ('never', 'daily', 'weekly', 'monthly')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_logs
CREATE POLICY "Users can view their own email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert email logs"
  ON email_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update email logs"
  ON email_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for email_preferences
CREATE POLICY "Users can view their own email preferences"
  ON email_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email preferences"
  ON email_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences"
  ON email_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to auto-create email preferences for new users
CREATE OR REPLACE FUNCTION create_email_preferences_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.email_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create email preferences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_email_preferences'
  ) THEN
    CREATE TRIGGER on_auth_user_created_email_preferences
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION create_email_preferences_for_new_user();
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);
