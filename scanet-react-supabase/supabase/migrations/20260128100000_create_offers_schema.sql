-- ============================================
-- CRÉATION DES TABLES POUR LES OFFRES
-- ============================================

-- Table des offres
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2),
    currency VARCHAR(3) DEFAULT 'EUR',
    duration VARCHAR(100), -- Ex: "1 mois", "1 an", "Ponctuel"
    category VARCHAR(100),
    features TEXT[], -- Liste des fonctionnalités/avantages
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des packs d'offres
CREATE TABLE IF NOT EXISTS offer_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5, 2) DEFAULT 0, -- Réduction en %
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison offres <-> packs (many-to-many)
CREATE TABLE IF NOT EXISTS offer_pack_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id UUID NOT NULL REFERENCES offer_packs(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pack_id, offer_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_offers_user_id ON offers(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_is_active ON offers(is_active);
CREATE INDEX IF NOT EXISTS idx_offer_packs_user_id ON offer_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_pack_items_pack_id ON offer_pack_items(pack_id);
CREATE INDEX IF NOT EXISTS idx_offer_pack_items_offer_id ON offer_pack_items(offer_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_offers_updated_at();

CREATE TRIGGER trigger_offer_packs_updated_at
    BEFORE UPDATE ON offer_packs
    FOR EACH ROW
    EXECUTE FUNCTION update_offers_updated_at();

-- RLS Policies (désactivées pour le dev comme les autres tables)
-- ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE offer_packs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE offer_pack_items ENABLE ROW LEVEL SECURITY;
