/*
  # Ajout de colonnes manquantes à la table offers

  ## Changements
  
  1. Nouvelles colonnes dans offers
    - billing_type (type de facturation: hourly, daily, fixed, unit)
    - hourly_rate (taux horaire)
    - estimated_hours (heures estimées)
    - daily_rate (taux journalier)
    - estimated_days (jours estimés)
    - unit_price (prix unitaire)
    - quantity (quantité)
    - image_url (URL de l'image)
  
  2. Notes importantes
    - Ces colonnes permettent différents types de facturation
    - Toutes les colonnes sont nullables
    - Les données existantes ne sont pas affectées
*/

-- Ajouter les colonnes manquantes à la table offers
DO $$ 
BEGIN
  -- billing_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'billing_type'
  ) THEN
    ALTER TABLE offers ADD COLUMN billing_type VARCHAR(20) DEFAULT 'fixed' CHECK (billing_type IN ('hourly', 'daily', 'fixed', 'unit'));
  END IF;

  -- hourly_rate
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE offers ADD COLUMN hourly_rate NUMERIC(10, 2);
  END IF;

  -- estimated_hours
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'estimated_hours'
  ) THEN
    ALTER TABLE offers ADD COLUMN estimated_hours NUMERIC(10, 2);
  END IF;

  -- daily_rate
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'daily_rate'
  ) THEN
    ALTER TABLE offers ADD COLUMN daily_rate NUMERIC(10, 2);
  END IF;

  -- estimated_days
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'estimated_days'
  ) THEN
    ALTER TABLE offers ADD COLUMN estimated_days INTEGER;
  END IF;

  -- unit_price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE offers ADD COLUMN unit_price NUMERIC(10, 2);
  END IF;

  -- quantity
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE offers ADD COLUMN quantity INTEGER;
  END IF;

  -- image_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE offers ADD COLUMN image_url TEXT;
  END IF;
END $$;