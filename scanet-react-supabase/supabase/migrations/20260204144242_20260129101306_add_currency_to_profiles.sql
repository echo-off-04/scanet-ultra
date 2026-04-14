/*
  # Ajout de la gestion des devises

  1. Modifications
    - Ajout du champ `preferred_currency` à la table `profiles`
      - Type: `text`
      - Valeur par défaut: `'EUR'`
      - Description: Devise préférée de l'utilisateur pour l'affichage des montants

    - Ajout de champs supplémentaires à la table `profiles`
      - `phone`: Numéro de téléphone
      - `bio`: Biographie
      - `website`: Site web
      - `linkedin`: Profil LinkedIn
      - `country`: Pays
      - `city`: Ville

  2. Notes importantes
    - La conversion des devises sera gérée côté frontend via l'API Frankfurter
    - Les montants existants dans les tables ne sont pas modifiés
    - Les taux de change seront appliqués dynamiquement à l'affichage
*/

-- Ajouter le champ preferred_currency à la table profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_currency'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferred_currency text DEFAULT 'EUR';
  END IF;
END $$;

-- Ajouter les champs additionnels s'ils n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'website'
  ) THEN
    ALTER TABLE profiles ADD COLUMN website text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'linkedin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN linkedin text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city text;
  END IF;
END $$;

-- Commenter le champ pour documentation
COMMENT ON COLUMN profiles.preferred_currency IS 'Devise préférée de l''utilisateur (EUR, USD, GBP, etc.)';