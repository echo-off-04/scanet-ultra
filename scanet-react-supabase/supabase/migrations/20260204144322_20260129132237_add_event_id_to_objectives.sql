/*
  # Lier les objectifs aux événements

  1. Modifications
    - Ajouter event_id aux enterprise_objectives
    - Ajouter event_id aux team_objectives
    - Supprimer start_date et end_date (remplacés par l'événement)
    - Ajouter des index pour les performances

  2. Sécurité
    - Maintien de RLS désactivé pour le développement
*/

-- Ajouter event_id aux objectifs d'entreprise
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enterprise_objectives' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE enterprise_objectives ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ajouter event_id aux objectifs d'équipe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_objectives' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE team_objectives ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_enterprise_objectives_event ON enterprise_objectives(event_id);
CREATE INDEX IF NOT EXISTS idx_team_objectives_event ON team_objectives(event_id);