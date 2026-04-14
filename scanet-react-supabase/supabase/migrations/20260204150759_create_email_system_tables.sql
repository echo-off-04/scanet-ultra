/*
  # Créer le système d'envoi d'emails avec Resend

  1. Nouvelles Tables
    - `email_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `to_email` (text) - Email du destinataire
      - `from_email` (text) - Email de l'expéditeur
      - `subject` (text) - Sujet de l'email
      - `body_html` (text) - Contenu HTML de l'email
      - `body_text` (text) - Contenu texte de l'email
      - `email_type` (text) - Type d'email (welcome, notification, reset_password, etc.)
      - `status` (text) - Statut (pending, sent, failed, bounced)
      - `resend_id` (text) - ID de l'email chez Resend
      - `error_message` (text) - Message d'erreur si échec
      - `sent_at` (timestamptz) - Date d'envoi
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `email_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, unique)
      - `welcome_emails` (boolean) - Recevoir les emails de bienvenue
      - `notification_emails` (boolean) - Recevoir les notifications par email
      - `marketing_emails` (boolean) - Recevoir les emails marketing
      - `event_reminders` (boolean) - Recevoir les rappels d'événements
      - `contact_updates` (boolean) - Recevoir les mises à jour de contacts
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour que les utilisateurs puissent voir leurs propres logs et préférences
*/

-- Créer la table email_logs
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  from_email text NOT NULL,
  subject text NOT NULL,
  body_html text,
  body_text text,
  email_type text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'pending',
  resend_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);

-- Créer la table email_preferences
CREATE TABLE IF NOT EXISTS email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  welcome_emails boolean DEFAULT true,
  notification_emails boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  event_reminders boolean DEFAULT true,
  contact_updates boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- Policies pour email_logs
CREATE POLICY "Users can view own email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email logs"
  ON email_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies pour email_preferences
CREATE POLICY "Users can view own email preferences"
  ON email_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences"
  ON email_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences"
  ON email_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour créer automatiquement les préférences email lors de la création d'un profil
CREATE OR REPLACE FUNCTION create_email_preferences_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer les préférences email automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created_email_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_email_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_email_preferences_for_new_user();

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_email_logs_updated_at ON email_logs;
CREATE TRIGGER update_email_logs_updated_at
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_preferences_updated_at ON email_preferences;
CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();