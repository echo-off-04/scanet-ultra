/*
  # Module de Gestion des Événements

  ## Description
  Cette migration crée les tables nécessaires pour le module complet de gestion des événements
  avec participants, objectifs, et métriques de performance.

  ## Nouvelles Tables
  
  ### `events` - Table principale des événements
  - `id` (uuid, PK) - Identifiant unique
  - `user_id` (uuid, FK) - Propriétaire de l'événement
  - `name` (text) - Nom de l'événement
  - `description` (text) - Description détaillée
  - `category` (text) - Catégorie (conference, seminar, networking, salon, gala, meetup)
  - `event_type` (text) - Type (presentiel, online, hybride)
  - `status` (text) - Statut (upcoming, ongoing, completed)
  - `start_date` (timestamptz) - Date et heure de début
  - `end_date` (timestamptz) - Date et heure de fin
  - `location` (text) - Lieu physique ou lien virtuel
  - `image_url` (text) - URL de l'image/flyer
  - `target_participants` (integer) - Nombre cible de participants
  - `actual_participants` (integer) - Nombre réel de participants
  - `primary_objective` (text) - Objectif principal
  - `secondary_objectives` (text[]) - Objectifs secondaires
  - `target_audience` (text[]) - Type de public visé
  - `leads_generated` (integer) - Nombre de leads générés
  - `contacts_added` (integer) - Contacts ajoutés au CRM
  - `conversion_rate` (numeric) - Taux de conversion
  - `performance_score` (numeric) - Score de performance global
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Date de mise à jour

  ### `event_participants` - Participants aux événements
  - `id` (uuid, PK) - Identifiant unique
  - `event_id` (uuid, FK) - Référence à l'événement
  - `contact_id` (uuid, FK, nullable) - Référence au contact dans le CRM
  - `user_id` (uuid, FK) - Utilisateur qui a ajouté le participant
  - `full_name` (text) - Nom complet
  - `email` (text) - Email
  - `phone` (text) - Téléphone
  - `company` (text) - Entreprise
  - `job_title` (text) - Poste
  - `tag` (text) - Tag (lead, prospect, client, partner)
  - `notes` (text) - Notes sur le participant
  - `met_at_event` (boolean) - Rencontré lors de l'événement
  - `added_to_crm` (boolean) - Ajouté au CRM
  - `follow_up_required` (boolean) - Suivi requis
  - `interaction_quality` (text) - Qualité de l'interaction (high, medium, low)
  - `created_at` (timestamptz) - Date d'ajout

  ## Sécurité
  - RLS activé sur toutes les tables
  - Les utilisateurs peuvent uniquement voir et gérer leurs propres événements
  - Les utilisateurs peuvent uniquement voir les participants de leurs événements

  ## Notes Importantes
  1. Les métriques de performance sont calculées automatiquement
  2. Le statut de l'événement peut être mis à jour automatiquement selon les dates
  3. Les objectifs sont stockés sous forme de tableau pour flexibilité
*/

-- Mettre à jour la table events existante avec les nouveaux champs
ALTER TABLE events ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS category text DEFAULT 'conference';
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'presentiel';
ALTER TABLE events ADD COLUMN IF NOT EXISTS status text DEFAULT 'upcoming';
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_date timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS target_participants integer DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS actual_participants integer DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS primary_objective text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS secondary_objectives text[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS target_audience text[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS leads_generated integer DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contacts_added integer DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS conversion_rate numeric(5,2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS performance_score numeric(5,2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Renommer event_date en start_date si nécessaire
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'event_date'
  ) THEN
    UPDATE events SET start_date = event_date WHERE start_date IS NULL;
  END IF;
END $$;

-- Créer la table event_participants
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  company text,
  job_title text,
  tag text DEFAULT 'lead',
  notes text,
  met_at_event boolean DEFAULT true,
  added_to_crm boolean DEFAULT false,
  follow_up_required boolean DEFAULT false,
  interaction_quality text DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

-- Activer RLS sur event_participants
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Politique pour event_participants - SELECT
CREATE POLICY "Users can view participants of their events"
  ON event_participants FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_participants.event_id 
      AND events.user_id = auth.uid()
    )
  );

-- Politique pour event_participants - INSERT
CREATE POLICY "Users can add participants to their events"
  ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_participants.event_id 
      AND events.user_id = auth.uid()
    )
  );

-- Politique pour event_participants - UPDATE
CREATE POLICY "Users can update participants of their events"
  ON event_participants FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_participants.event_id 
      AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_participants.event_id 
      AND events.user_id = auth.uid()
    )
  );

-- Politique pour event_participants - DELETE
CREATE POLICY "Users can delete participants from their events"
  ON event_participants FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_participants.event_id 
      AND events.user_id = auth.uid()
    )
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at sur events
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer le nombre de participants
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET actual_participants = (
    SELECT COUNT(*) FROM event_participants WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le nombre de participants
DROP TRIGGER IF EXISTS update_participant_count_insert ON event_participants;
CREATE TRIGGER update_participant_count_insert
  AFTER INSERT ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_event_participant_count();

DROP TRIGGER IF EXISTS update_participant_count_delete ON event_participants;
CREATE TRIGGER update_participant_count_delete
  AFTER DELETE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_event_participant_count();

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_contact_id ON event_participants(contact_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);