-- Ajout de la colonne assigned_to a la table enterprise_objectives
-- Cette colonne permet d'assigner un objectif d'entreprise a un membre specifique
--
-- 1. Modification de Table
--    - enterprise_objectives
--      - assigned_to: uuid, nullable, reference vers contacts.id
--      - Permet d'assigner un objectif entreprise a un contact/membre
--
-- 2. Note
--    - Cette colonne est similaire a celle presente dans team_objectives
--    - Elle permet de deleguer des objectifs d'entreprise a des membres individuels

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enterprise_objectives' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE enterprise_objectives ADD COLUMN assigned_to uuid REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
END $$;