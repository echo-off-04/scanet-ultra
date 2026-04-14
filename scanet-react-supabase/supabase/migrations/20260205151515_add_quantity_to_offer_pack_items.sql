/*
  # Add quantity column to offer_pack_items

  1. Changes
    - Add `quantity` column to `offer_pack_items` table with default value of 1
    - This allows tracking how many units of each offer are included in a pack
  
  2. Notes
    - Uses IF NOT EXISTS pattern to avoid errors on re-runs
    - Default value of 1 ensures existing records work correctly
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offer_pack_items' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE offer_pack_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;
