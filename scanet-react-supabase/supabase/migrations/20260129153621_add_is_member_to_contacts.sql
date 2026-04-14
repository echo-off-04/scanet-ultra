/*
  # Ajout du champ is_member à la table contacts

  ## Description
  Cette migration ajoute un champ booléen is_member à la table contacts pour permettre d'identifier les contacts qui sont des membres de l'entreprise de l'utilisateur.

  ## Modifications
  1. Ajout du champ
    - `is_member` (boolean) - Indique si le contact est un membre de l'entreprise de l'utilisateur
    - Valeur par défaut: false

  ## Notes importantes
  - Ce champ permet de différencier les contacts externes des membres internes de l'entreprise
  - Utilisé dans les équipes et groupes personnalisés
*/

-- Ajouter le champ is_member à la table contacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'is_member'
  ) THEN
    ALTER TABLE contacts ADD COLUMN is_member BOOLEAN DEFAULT false;
  END IF;
END $$;
