/*
  # Add Complete Enterprise RLS Policies

  ## Overview
  This migration adds comprehensive RLS policies for all enterprise-related tables
  to ensure users can properly create and manage their enterprise data.

  ## Security Changes
  1. Enterprises Table
    - Users can view, create, update, and delete their own enterprises
    - Access controlled by owner_id field

  2. Teams Table
    - Users can manage teams within their own enterprises
    - Access controlled via enterprise ownership

  3. Team Members Table
    - Users can manage members of teams in their enterprises
    - Access controlled via enterprise ownership through teams

  4. Custom Groups Table
    - Users can manage custom groups in their enterprises
    - Access controlled via enterprise ownership

  5. Custom Group Members Table
    - Users can manage members of their custom groups
    - Access controlled via group ownership

  6. Enterprise Objectives Table
    - Users can manage objectives for their enterprises
    - Access controlled via enterprise ownership

  7. Team Objectives Table
    - Users can manage team objectives in their enterprises
    - Access controlled via team ownership through enterprises

  8. Team Events Table
    - Users can manage team event associations
    - Access controlled via team ownership through enterprises

  ## Notes
  - All policies check authentication status
  - Policies follow the principle of least privilege
  - Foreign key relationships are used for access control
*/

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ENTERPRISES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own enterprise" ON enterprises;
DROP POLICY IF EXISTS "Users can create own enterprise" ON enterprises;
DROP POLICY IF EXISTS "Users can update own enterprise" ON enterprises;
DROP POLICY IF EXISTS "Users can delete own enterprise" ON enterprises;

CREATE POLICY "Users can view own enterprise"
  ON enterprises FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own enterprise"
  ON enterprises FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own enterprise"
  ON enterprises FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own enterprise"
  ON enterprises FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- =====================================================
-- TEAMS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own teams" ON teams;
DROP POLICY IF EXISTS "Users can create own teams" ON teams;
DROP POLICY IF EXISTS "Users can update own teams" ON teams;
DROP POLICY IF EXISTS "Users can delete own teams" ON teams;

CREATE POLICY "Users can view own teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = teams.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = teams.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = teams.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = teams.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own teams"
  ON teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = teams.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  );

-- =====================================================
-- TEAM MEMBERS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own team members" ON team_members;
DROP POLICY IF EXISTS "Users can create own team members" ON team_members;
DROP POLICY IF EXISTS "Users can update own team members" ON team_members;
DROP POLICY IF EXISTS "Users can delete own team members" ON team_members;

CREATE POLICY "Users can view own team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      JOIN enterprises ON enterprises.id = teams.enterprise_id
      WHERE teams.id = team_members.team_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      JOIN enterprises ON enterprises.id = teams.enterprise_id
      WHERE teams.id = team_members.team_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      JOIN enterprises ON enterprises.id = teams.enterprise_id
      WHERE teams.id = team_members.team_id
      AND enterprises.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      JOIN enterprises ON enterprises.id = teams.enterprise_id
      WHERE teams.id = team_members.team_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      JOIN enterprises ON enterprises.id = teams.enterprise_id
      WHERE teams.id = team_members.team_id
      AND enterprises.owner_id = auth.uid()
    )
  );

-- =====================================================
-- CUSTOM GROUPS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own custom groups" ON custom_groups;
DROP POLICY IF EXISTS "Users can create own custom groups" ON custom_groups;
DROP POLICY IF EXISTS "Users can update own custom groups" ON custom_groups;
DROP POLICY IF EXISTS "Users can delete own custom groups" ON custom_groups;

CREATE POLICY "Users can view own custom groups"
  ON custom_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = custom_groups.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own custom groups"
  ON custom_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = custom_groups.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own custom groups"
  ON custom_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = custom_groups.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = custom_groups.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own custom groups"
  ON custom_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = custom_groups.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  );

-- =====================================================
-- CUSTOM GROUP MEMBERS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own custom group members" ON custom_group_members;
DROP POLICY IF EXISTS "Users can create own custom group members" ON custom_group_members;
DROP POLICY IF EXISTS "Users can delete own custom group members" ON custom_group_members;

CREATE POLICY "Users can view own custom group members"
  ON custom_group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_groups
      JOIN enterprises ON enterprises.id = custom_groups.enterprise_id
      WHERE custom_groups.id = custom_group_members.group_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own custom group members"
  ON custom_group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_groups
      JOIN enterprises ON enterprises.id = custom_groups.enterprise_id
      WHERE custom_groups.id = custom_group_members.group_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own custom group members"
  ON custom_group_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_groups
      JOIN enterprises ON enterprises.id = custom_groups.enterprise_id
      WHERE custom_groups.id = custom_group_members.group_id
      AND enterprises.owner_id = auth.uid()
    )
  );

-- =====================================================
-- ENTERPRISE OBJECTIVES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own enterprise objectives" ON enterprise_objectives;
DROP POLICY IF EXISTS "Users can create own enterprise objectives" ON enterprise_objectives;
DROP POLICY IF EXISTS "Users can update own enterprise objectives" ON enterprise_objectives;
DROP POLICY IF EXISTS "Users can delete own enterprise objectives" ON enterprise_objectives;

CREATE POLICY "Users can view own enterprise objectives"
  ON enterprise_objectives FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = enterprise_objectives.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own enterprise objectives"
  ON enterprise_objectives FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = enterprise_objectives.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own enterprise objectives"
  ON enterprise_objectives FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = enterprise_objectives.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = enterprise_objectives.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own enterprise objectives"
  ON enterprise_objectives FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enterprises
      WHERE enterprises.id = enterprise_objectives.enterprise_id
      AND enterprises.owner_id = auth.uid()
    )
  );

-- =====================================================
-- TEAM OBJECTIVES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own team objectives" ON team_objectives;
DROP POLICY IF EXISTS "Users can create own team objectives" ON team_objectives;
DROP POLICY IF EXISTS "Users can update own team objectives" ON team_objectives;
DROP POLICY IF EXISTS "Users can delete own team objectives" ON team_objectives;

CREATE POLICY "Users can view own team objectives"
  ON team_objectives FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      JOIN enterprises ON enterprises.id = teams.enterprise_id
      WHERE teams.id = team_objectives.team_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own team objectives"
  ON team_objectives FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      JOIN enterprises ON enterprises.id = teams.enterprise_id
      WHERE teams.id = team_objectives.team_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own team objectives"
  ON team_objectives FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      JOIN enterprises ON enterprises.id = teams.enterprise_id
      WHERE teams.id = team_objectives.team_id
      AND enterprises.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      JOIN enterprises ON enterprises.id = teams.enterprise_id
      WHERE teams.id = team_objectives.team_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own team objectives"
  ON team_objectives FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      JOIN enterprises ON enterprises.id = teams.enterprise_id
      WHERE teams.id = team_objectives.team_id
      AND enterprises.owner_id = auth.uid()
    )
  );

-- =====================================================
-- TEAM EVENTS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own team events" ON team_events;
DROP POLICY IF EXISTS "Users can create own team events" ON team_events;
DROP POLICY IF EXISTS "Users can delete own team events" ON team_events;

CREATE POLICY "Users can view own team events"
  ON team_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      JOIN enterprises ON enterprises.id = teams.enterprise_id
      WHERE teams.id = team_events.team_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own team events"
  ON team_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      JOIN enterprises ON enterprises.id = teams.enterprise_id
      WHERE teams.id = team_events.team_id
      AND enterprises.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own team events"
  ON team_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      JOIN enterprises ON enterprises.id = teams.enterprise_id
      WHERE teams.id = team_events.team_id
      AND enterprises.owner_id = auth.uid()
    )
  );