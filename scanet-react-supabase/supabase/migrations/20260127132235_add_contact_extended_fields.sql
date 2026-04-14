/*
  # Add Extended Fields to Contacts

  1. Changes
    - Add city, region, country fields for location tracking
    - Add relationship field to categorize contact relationships
    - Add opportunity_amount field for potential business value

  2. New Columns
    - `city` (text) - Contact's city
    - `region` (text) - Contact's region/state
    - `country` (text) - Contact's country
    - `relationship` (text) - Type of relationship (colleague, client, vendor, partner, friend, other)
    - `opportunity_amount` (numeric) - Potential business value in currency

  3. Security
    - No RLS changes needed (already disabled for development)
*/

-- Add location fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'city'
  ) THEN
    ALTER TABLE contacts ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'region'
  ) THEN
    ALTER TABLE contacts ADD COLUMN region text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'country'
  ) THEN
    ALTER TABLE contacts ADD COLUMN country text;
  END IF;
END $$;

-- Add relationship field with constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'relationship'
  ) THEN
    ALTER TABLE contacts ADD COLUMN relationship text CHECK (
      relationship IN ('colleague', 'client', 'vendor', 'partner', 'friend', 'other')
    );
  END IF;
END $$;

-- Add opportunity amount field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'opportunity_amount'
  ) THEN
    ALTER TABLE contacts ADD COLUMN opportunity_amount numeric(12, 2) DEFAULT 0;
  END IF;
END $$;

-- Create indexes for better filtering performance
CREATE INDEX IF NOT EXISTS idx_contacts_city ON contacts(city);
CREATE INDEX IF NOT EXISTS idx_contacts_region ON contacts(region);
CREATE INDEX IF NOT EXISTS idx_contacts_country ON contacts(country);
CREATE INDEX IF NOT EXISTS idx_contacts_relationship ON contacts(relationship);
CREATE INDEX IF NOT EXISTS idx_contacts_opportunity_amount ON contacts(opportunity_amount);
CREATE INDEX IF NOT EXISTS idx_contacts_full_name ON contacts(full_name);
CREATE INDEX IF NOT EXISTS idx_contacts_rating ON contacts(rating);
