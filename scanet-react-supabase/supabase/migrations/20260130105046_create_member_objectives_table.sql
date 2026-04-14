-- Creation de la table member_objectives pour les objectifs individuels des membres
-- 
-- 1. Nouvelle Table: member_objectives
--    - id: uuid, cle primaire
--    - member_id: uuid, reference vers contacts avec is_member=true
--    - enterprise_id: uuid, reference vers enterprises
--    - title: varchar, titre de l'objectif
--    - description: text, nullable, description detaillee
--    - target_value: numeric, nullable, valeur cible a atteindre
--    - current_value: numeric, default 0, valeur actuelle
--    - unit: varchar, nullable, unite de mesure
--    - currency: varchar, default EUR, devise si objectif monetaire
--    - start_date: date, nullable, date de debut
--    - end_date: date, nullable, date de fin
--    - status: varchar, default not_started, statut de l'objectif
--    - priority: varchar, default medium, priorite
--    - linked_objective_type: varchar, nullable, type d'objectif lie
--    - linked_objective_id: uuid, nullable, ID de l'objectif lie
--    - created_by: uuid, utilisateur qui a cree l'objectif
--    - created_at: timestamptz
--    - updated_at: timestamptz
--
-- 2. Securite
--    - Enable RLS sur member_objectives
--    - Politiques pour lecture/ecriture par utilisateurs authentifies

CREATE TABLE IF NOT EXISTS member_objectives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    enterprise_id uuid NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    description text,
    target_value numeric,
    current_value numeric DEFAULT 0,
    unit varchar(50),
    currency varchar(3) DEFAULT 'EUR',
    start_date date,
    end_date date,
    status varchar(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'cancelled')),
    priority varchar(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    linked_objective_type varchar(20) CHECK (linked_objective_type IN ('enterprise', 'team')),
    linked_objective_id uuid,
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE member_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view member objectives in their enterprises"
    ON member_objectives
    FOR SELECT
    TO authenticated
    USING (
        enterprise_id IN (
            SELECT id FROM enterprises WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create member objectives in their enterprises"
    ON member_objectives
    FOR INSERT
    TO authenticated
    WITH CHECK (
        enterprise_id IN (
            SELECT id FROM enterprises WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update member objectives in their enterprises"
    ON member_objectives
    FOR UPDATE
    TO authenticated
    USING (
        enterprise_id IN (
            SELECT id FROM enterprises WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        enterprise_id IN (
            SELECT id FROM enterprises WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete member objectives in their enterprises"
    ON member_objectives
    FOR DELETE
    TO authenticated
    USING (
        enterprise_id IN (
            SELECT id FROM enterprises WHERE owner_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_member_objectives_member_id ON member_objectives(member_id);
CREATE INDEX IF NOT EXISTS idx_member_objectives_enterprise_id ON member_objectives(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_member_objectives_linked_objective ON member_objectives(linked_objective_type, linked_objective_id);