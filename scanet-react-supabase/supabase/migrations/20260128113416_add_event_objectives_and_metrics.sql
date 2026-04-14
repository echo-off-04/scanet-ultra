-- Module Objectifs d'Événements et Métriques Étendues
--
-- Description:
-- Cette migration ajoute une gestion complète des objectifs d'événements avec des métriques
-- détaillées pour suivre les performances et le ROI.
--
-- Modifications de la Table events:
-- - budget (numeric) - Budget alloué à l'événement en euros
-- - revenue (numeric) - Revenus générés suite à l'événement  
-- - people_approached (integer) - Nombre de personnes approchées lors de l'événement
--
-- Nouvelle Table event_objectives:
-- Table pour gérer les objectifs quantifiables d'un événement avec type primary/secondary
-- et métriques people_count, opportunity_value, quality_score
--
-- Sécurité:
-- - RLS activé sur event_objectives
-- - Les utilisateurs peuvent uniquement voir et gérer les objectifs de leurs événements

-- Ajouter les champs manquants à la table events
ALTER TABLE events ADD COLUMN IF NOT EXISTS budget numeric(12,2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS revenue numeric(12,2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS people_approached integer DEFAULT 0;

-- Créer la table event_objectives
CREATE TABLE IF NOT EXISTS event_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  objective_type text NOT NULL CHECK (objective_type IN ('primary', 'secondary')),
  metric_type text NOT NULL CHECK (metric_type IN ('people_count', 'opportunity_value', 'quality_score')),
  title text NOT NULL,
  description text,
  target_value numeric(12,2) NOT NULL,
  current_value numeric(12,2) DEFAULT 0,
  unit text NOT NULL,
  achieved boolean DEFAULT false,
  priority integer DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS sur event_objectives
ALTER TABLE event_objectives ENABLE ROW LEVEL SECURITY;

-- Politique pour event_objectives - SELECT
CREATE POLICY "Users can view objectives of their events"
  ON event_objectives FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_objectives.event_id 
      AND events.user_id = auth.uid()
    )
  );

-- Politique pour event_objectives - INSERT
CREATE POLICY "Users can add objectives to their events"
  ON event_objectives FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_objectives.event_id 
      AND events.user_id = auth.uid()
    )
  );

-- Politique pour event_objectives - UPDATE
CREATE POLICY "Users can update objectives of their events"
  ON event_objectives FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_objectives.event_id 
      AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_objectives.event_id 
      AND events.user_id = auth.uid()
    )
  );

-- Politique pour event_objectives - DELETE
CREATE POLICY "Users can delete objectives from their events"
  ON event_objectives FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_objectives.event_id 
      AND events.user_id = auth.uid()
    )
  );

-- Trigger pour mettre à jour updated_at sur event_objectives
DROP TRIGGER IF EXISTS update_event_objectives_updated_at ON event_objectives;
CREATE TRIGGER update_event_objectives_updated_at
  BEFORE UPDATE ON event_objectives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_event_objectives_event_id ON event_objectives(event_id);
CREATE INDEX IF NOT EXISTS idx_event_objectives_user_id ON event_objectives(user_id);
CREATE INDEX IF NOT EXISTS idx_event_objectives_type ON event_objectives(objective_type);
CREATE INDEX IF NOT EXISTS idx_event_objectives_metric_type ON event_objectives(metric_type);