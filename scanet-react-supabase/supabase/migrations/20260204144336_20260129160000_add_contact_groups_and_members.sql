/*
  # Ajout des groupes de contacts, champ membre, et améliorations offres

  1. Modifications
    - Ajout du champ `is_member` sur la table contacts
    - Création de la table `contact_groups` pour les groupes de contacts
    - Création de la table `contact_group_members` pour les membres des groupes
    - Ajout des champs `image_url` et `price` sur offer_packs
    - Ajout du champ `image_url` sur offers
    - Création de la table `offer_sends` pour le suivi des envois d'offres

  2. Sécurité
    - RLS désactivé pour le développement
*/

-- Ajouter le champ is_member sur contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_member BOOLEAN DEFAULT false;

-- Table des groupes de contacts (pour l'utilisateur, pas l'entreprise)
CREATE TABLE IF NOT EXISTS contact_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366F1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des membres des groupes de contacts
CREATE TABLE IF NOT EXISTS contact_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES contact_groups(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, contact_id)
);

-- Ajouter image_url sur offers si pas déjà présent
ALTER TABLE offers ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Ajouter price et image_url sur offer_packs
ALTER TABLE offer_packs ADD COLUMN IF NOT EXISTS price DECIMAL(15, 2);
ALTER TABLE offer_packs ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Table pour le suivi des envois d'offres
CREATE TABLE IF NOT EXISTS offer_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
    pack_id UUID REFERENCES offer_packs(id) ON DELETE SET NULL,
    recipient_contact_ids UUID[] DEFAULT '{}',
    recipient_group_ids UUID[] DEFAULT '{}',
    message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_contact_groups_user ON contact_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_group_members_group ON contact_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_contact_group_members_contact ON contact_group_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_contacts_is_member ON contacts(is_member) WHERE is_member = true;
CREATE INDEX IF NOT EXISTS idx_offer_sends_user ON offer_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_sends_offer ON offer_sends(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_sends_pack ON offer_sends(pack_id);

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_contact_groups_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contact_groups_timestamp ON contact_groups;
CREATE TRIGGER update_contact_groups_timestamp
    BEFORE UPDATE ON contact_groups
    FOR EACH ROW EXECUTE FUNCTION update_contact_groups_timestamp();

-- Désactiver RLS pour le développement
ALTER TABLE contact_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE offer_sends DISABLE ROW LEVEL SECURITY;