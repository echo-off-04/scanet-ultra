/*
  # Ajout du type de facturation aux offres

  1. Modifications à la table `offers`
    - Ajout du champ `billing_type` (VARCHAR) - Type de facturation: 'hourly', 'daily', 'fixed', 'unit'
    - Ajout du champ `hourly_rate` (DECIMAL) - Taux horaire pour facturation horaire
    - Ajout du champ `estimated_hours` (DECIMAL) - Nombre d'heures estimées
    - Ajout du champ `daily_rate` (DECIMAL) - Taux journalier
    - Ajout du champ `estimated_days` (INTEGER) - Nombre de jours estimés
    - Ajout du champ `unit_price` (DECIMAL) - Prix par unité/pack
    - Ajout du champ `quantity` (INTEGER) - Quantité d'unités
    - Le champ `price` devient le prix calculé automatiquement selon le type de facturation

  2. Notes
    - Le champ `duration` reste pour compatibilité mais n'est plus utilisé pour les nouveaux formulaires
    - Le prix est calculé automatiquement selon le billing_type:
      * hourly: hourly_rate × estimated_hours
      * daily: daily_rate × estimated_days
      * fixed: price (défini manuellement)
      * unit: unit_price × quantity
*/

-- Ajouter les nouveaux champs à la table offers
DO $$
BEGIN
  -- Billing type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'billing_type'
  ) THEN
    ALTER TABLE offers ADD COLUMN billing_type VARCHAR(20) DEFAULT 'fixed' CHECK (billing_type IN ('hourly', 'daily', 'fixed', 'unit'));
  END IF;

  -- Hourly rate fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE offers ADD COLUMN hourly_rate DECIMAL(12, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'estimated_hours'
  ) THEN
    ALTER TABLE offers ADD COLUMN estimated_hours DECIMAL(8, 2);
  END IF;

  -- Daily rate fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'daily_rate'
  ) THEN
    ALTER TABLE offers ADD COLUMN daily_rate DECIMAL(12, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'estimated_days'
  ) THEN
    ALTER TABLE offers ADD COLUMN estimated_days INTEGER;
  END IF;

  -- Unit/pack fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE offers ADD COLUMN unit_price DECIMAL(12, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE offers ADD COLUMN quantity INTEGER;
  END IF;
END $$;

-- Créer un index pour le billing_type
CREATE INDEX IF NOT EXISTS idx_offers_billing_type ON offers(billing_type);