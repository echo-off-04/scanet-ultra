/*
  # Activation de RLS pour les tables d'offres

  ## Changements
  
  1. Activation de RLS sur les tables d'offres
    - offers
    - offer_packs
    - offer_pack_items
  
  2. Politiques de sécurité
    - Chaque utilisateur peut gérer ses propres offres et packs
    - Les utilisateurs authentifiés peuvent lire/écrire leurs propres données
    - Restrictions basées sur auth.uid() pour garantir l'isolation des données
  
  3. Notes importantes
    - Cette migration corrige les problèmes d'insertion/mise à jour des offres
    - Toutes les opérations sont sécurisées par RLS
    - Les données existantes restent intactes
*/

-- Activer RLS sur offers (si pas déjà fait)
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own offers" ON offers;
  DROP POLICY IF EXISTS "Users can insert own offers" ON offers;
  DROP POLICY IF EXISTS "Users can update own offers" ON offers;
  DROP POLICY IF EXISTS "Users can delete own offers" ON offers;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Créer les politiques pour offers
CREATE POLICY "Users can view own offers"
  ON offers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offers"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offers"
  ON offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own offers"
  ON offers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Activer RLS sur offer_packs (si pas déjà fait)
ALTER TABLE offer_packs ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own offer_packs" ON offer_packs;
  DROP POLICY IF EXISTS "Users can insert own offer_packs" ON offer_packs;
  DROP POLICY IF EXISTS "Users can update own offer_packs" ON offer_packs;
  DROP POLICY IF EXISTS "Users can delete own offer_packs" ON offer_packs;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Créer les politiques pour offer_packs
CREATE POLICY "Users can view own offer_packs"
  ON offer_packs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offer_packs"
  ON offer_packs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offer_packs"
  ON offer_packs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own offer_packs"
  ON offer_packs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Activer RLS sur offer_pack_items (si pas déjà fait)
ALTER TABLE offer_pack_items ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view offer_pack_items through packs" ON offer_pack_items;
  DROP POLICY IF EXISTS "Users can insert offer_pack_items for own packs" ON offer_pack_items;
  DROP POLICY IF EXISTS "Users can update own offer_pack_items" ON offer_pack_items;
  DROP POLICY IF EXISTS "Users can delete own offer_pack_items" ON offer_pack_items;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Créer les politiques pour offer_pack_items
CREATE POLICY "Users can view offer_pack_items through packs"
  ON offer_pack_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM offer_packs
      WHERE offer_packs.id = offer_pack_items.pack_id
      AND offer_packs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert offer_pack_items for own packs"
  ON offer_pack_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM offer_packs
      WHERE offer_packs.id = offer_pack_items.pack_id
      AND offer_packs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own offer_pack_items"
  ON offer_pack_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM offer_packs
      WHERE offer_packs.id = offer_pack_items.pack_id
      AND offer_packs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM offer_packs
      WHERE offer_packs.id = offer_pack_items.pack_id
      AND offer_packs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own offer_pack_items"
  ON offer_pack_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM offer_packs
      WHERE offer_packs.id = offer_pack_items.pack_id
      AND offer_packs.user_id = auth.uid()
    )
  );