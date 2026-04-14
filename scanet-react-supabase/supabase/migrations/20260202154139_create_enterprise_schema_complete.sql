/*
  # Create Enterprise Schema - Complete

  ## Overview
  This migration creates all tables needed for enterprise management, including
  teams, custom groups, objectives, and member management.

  ## New Tables
  1. enterprises - Main enterprise/company table
    - id (uuid, primary key)
    - name (varchar, required)
    - description (text)
    - logo_url (text)
    - industry (varchar)
    - size (varchar) - startup, pme, eti, grande_entreprise
    - owner_id (uuid, references auth.users)
    - created_at (timestamptz)
    - updated_at (timestamptz)

  2. teams - Hierarchical teams within enterprises
    - id (uuid, primary key)
    - enterprise_id (uuid, references enterprises)
    - parent_team_id (uuid, references teams) - for hierarchy
    - name (varchar, required)
    - description (text)
    - color (varchar) - team color
    - manager_id (uuid, references auth.users)
    - level (integer) - hierarchy level
    - created_at (timestamptz)
    - updated_at (timestamptz)

  3. team_members - Members of teams
    - id (uuid, primary key)
    - team_id (uuid, references teams)
    - contact_id (uuid, references contacts)
    - user_id (uuid, references auth.users)
    - role (varchar)
    - joined_at (timestamptz)
    - is_active (boolean)
    - created_at (timestamptz)
    - updated_at (timestamptz)

  4. custom_groups - Custom groupings within enterprises
    - id (uuid, primary key)
    - enterprise_id (uuid, references enterprises)
    - name (varchar, required)
    - description (text)
    - color (varchar)
    - icon (varchar)
    - created_by (uuid, references auth.users)
    - created_at (timestamptz)
    - updated_at (timestamptz)

  5. custom_group_members - Members of custom groups
    - id (uuid, primary key)
    - group_id (uuid, references custom_groups)
    - contact_id (uuid, references contacts)
    - added_at (timestamptz)

  6. enterprise_objectives - Objectives for entire enterprise
    - id (uuid, primary key)
    - enterprise_id (uuid, references enterprises)
    - title (varchar, required)
    - description (text)
    - target_value (decimal)
    - current_value (decimal)
    - unit (varchar)
    - currency (varchar)
    - start_date (date)
    - end_date (date)
    - status (varchar)
    - priority (varchar)
    - created_by (uuid, references auth.users)
    - created_at (timestamptz)
    - updated_at (timestamptz)

  7. team_objectives - Objectives for teams
    - id (uuid, primary key)
    - team_id (uuid, references teams)
    - enterprise_objective_id (uuid, references enterprise_objectives)
    - title (varchar, required)
    - description (text)
    - target_value (decimal)
    - current_value (decimal)
    - unit (varchar)
    - currency (varchar)
    - start_date (date)
    - end_date (date)
    - status (varchar)
    - priority (varchar)
    - assigned_to (uuid, references contacts)
    - created_by (uuid, references auth.users)
    - created_at (timestamptz)
    - updated_at (timestamptz)

  8. team_events - Association between teams and events
    - id (uuid, primary key)
    - team_id (uuid, references teams)
    - event_id (uuid, references events)
    - created_at (timestamptz)

  ## Notes
  - RLS is initially disabled for development
  - Triggers automatically update timestamps
  - Team levels are calculated automatically based on hierarchy
*/

-- Table des entreprises
CREATE TABLE IF NOT EXISTS enterprises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    industry VARCHAR(100),
    size VARCHAR(50),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des équipes (avec hiérarchie)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
    parent_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#0E3A5D',
    manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des membres d'équipe
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(100),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, contact_id)
);

-- Table des groupes personnalisés
CREATE TABLE IF NOT EXISTS custom_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366F1',
    icon VARCHAR(50) DEFAULT 'users',
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des membres de groupes personnalisés
CREATE TABLE IF NOT EXISTS custom_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES custom_groups(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, contact_id)
);

-- Table des objectifs d'entreprise
CREATE TABLE IF NOT EXISTS enterprise_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value DECIMAL(15, 2),
    current_value DECIMAL(15, 2) DEFAULT 0,
    unit VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'EUR',
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'in_progress',
    priority VARCHAR(20) DEFAULT 'medium',
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des objectifs d'équipe
CREATE TABLE IF NOT EXISTS team_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    enterprise_objective_id UUID REFERENCES enterprise_objectives(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value DECIMAL(15, 2),
    current_value DECIMAL(15, 2) DEFAULT 0,
    unit VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'EUR',
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'in_progress',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to UUID REFERENCES contacts(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour suivre les événements par équipe
CREATE TABLE IF NOT EXISTS team_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, event_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_teams_enterprise ON teams(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_teams_parent ON teams(parent_team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_contact ON team_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_custom_groups_enterprise ON custom_groups(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_custom_group_members_group ON custom_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_objectives_enterprise ON enterprise_objectives(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_team_objectives_team ON team_objectives(team_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_enterprise_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables
DROP TRIGGER IF EXISTS update_enterprises_timestamp ON enterprises;
CREATE TRIGGER update_enterprises_timestamp
    BEFORE UPDATE ON enterprises
    FOR EACH ROW EXECUTE FUNCTION update_enterprise_timestamp();

DROP TRIGGER IF EXISTS update_teams_timestamp ON teams;
CREATE TRIGGER update_teams_timestamp
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_enterprise_timestamp();

DROP TRIGGER IF EXISTS update_team_members_timestamp ON team_members;
CREATE TRIGGER update_team_members_timestamp
    BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_enterprise_timestamp();

DROP TRIGGER IF EXISTS update_custom_groups_timestamp ON custom_groups;
CREATE TRIGGER update_custom_groups_timestamp
    BEFORE UPDATE ON custom_groups
    FOR EACH ROW EXECUTE FUNCTION update_enterprise_timestamp();

DROP TRIGGER IF EXISTS update_enterprise_objectives_timestamp ON enterprise_objectives;
CREATE TRIGGER update_enterprise_objectives_timestamp
    BEFORE UPDATE ON enterprise_objectives
    FOR EACH ROW EXECUTE FUNCTION update_enterprise_timestamp();

DROP TRIGGER IF EXISTS update_team_objectives_timestamp ON team_objectives;
CREATE TRIGGER update_team_objectives_timestamp
    BEFORE UPDATE ON team_objectives
    FOR EACH ROW EXECUTE FUNCTION update_enterprise_timestamp();

-- Fonction pour calculer le niveau hiérarchique d'une équipe
CREATE OR REPLACE FUNCTION calculate_team_level()
RETURNS TRIGGER AS $$
DECLARE
    parent_level INTEGER;
BEGIN
    IF NEW.parent_team_id IS NULL THEN
        NEW.level = 1;
    ELSE
        SELECT level INTO parent_level FROM teams WHERE id = NEW.parent_team_id;
        NEW.level = COALESCE(parent_level, 0) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_team_level_trigger ON teams;
CREATE TRIGGER calculate_team_level_trigger
    BEFORE INSERT OR UPDATE OF parent_team_id ON teams
    FOR EACH ROW EXECUTE FUNCTION calculate_team_level();