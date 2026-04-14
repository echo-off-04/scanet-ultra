/*
  # Ajout de colonnes manquantes à la table offer_packs

  ## Changements
  
  1. Nouvelles colonnes dans offer_packs
    - price (prix total du pack)
    - image_url (URL de l'image du pack)
  
  2. Notes importantes
    - Ces colonnes permettent d'afficher le prix total et une image pour le pack
    - Toutes les colonnes sont nullables
    - Les données existantes ne sont pas affectées
*/

-- Ajouter les colonnes manquantes à la table offer_packs
DO $$ 
BEGIN
  -- price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offer_packs' AND column_name = 'price'
  ) THEN
    ALTER TABLE offer_packs ADD COLUMN price NUMERIC(10, 2);
  END IF;

  -- image_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offer_packs' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE offer_packs ADD COLUMN image_url TEXT;
  END IF;
END $$;