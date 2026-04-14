/*
  # Création de la table offer_sends

  ## Changements
  
  1. Nouvelle table offer_sends
    - id (UUID, clé primaire)
    - user_id (UUID, référence à auth.users)
    - offer_id (UUID, référence à offers, nullable)
    - pack_id (UUID, référence à offer_packs, nullable)
    - recipient_contact_ids (Array UUID, liste des contacts destinataires)
    - recipient_group_ids (Array UUID, liste des groupes destinataires)
    - message (TEXT, message personnalisé, nullable)
    - status (VARCHAR, statut de l'envoi)
    - created_at (TIMESTAMP)
  
  2. Politiques RLS
    - Les utilisateurs peuvent voir leurs propres envois d'offres
    - Les utilisateurs peuvent créer des envois d'offres
    - Les utilisateurs peuvent mettre à jour leurs propres envois
  
  3. Notes importantes
    - Cette table permet de suivre l'historique des envois d'offres aux contacts
    - Un envoi peut concerner soit une offre soit un pack
*/

-- Créer la table offer_sends si elle n'existe pas
CREATE TABLE IF NOT EXISTS offer_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES offer_packs(id) ON DELETE CASCADE,
  recipient_contact_ids UUID[] DEFAULT '{}',
  recipient_group_ids UUID[] DEFAULT '{}',
  message TEXT,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE offer_sends ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own offer sends" ON offer_sends;
  DROP POLICY IF EXISTS "Users can insert own offer sends" ON offer_sends;
  DROP POLICY IF EXISTS "Users can update own offer sends" ON offer_sends;
  DROP POLICY IF EXISTS "Users can delete own offer sends" ON offer_sends;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Créer les politiques pour offer_sends
CREATE POLICY "Users can view own offer sends"
  ON offer_sends FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offer sends"
  ON offer_sends FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offer sends"
  ON offer_sends FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own offer sends"
  ON offer_sends FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);