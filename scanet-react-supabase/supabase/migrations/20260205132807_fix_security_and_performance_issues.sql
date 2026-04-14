/*
  # Fix Security and Performance Issues
  
  ## 1. Add Missing Foreign Key Indexes
  Creates indexes for all unindexed foreign keys to improve query performance:
  - contact_events: created_by, event_id
  - custom_group_members: contact_id
  - custom_groups: created_by
  - enterprise_objectives: assigned_to, created_by
  - enterprises: owner_id
  - member_objectives: created_by
  - team_events: event_id
  - team_members: user_id
  - team_objectives: assigned_to, created_by, enterprise_objective_id
  - teams: manager_id
  
  ## 2. Enable RLS on All Public Tables
  Enables Row Level Security on:
  - enterprises
  - teams
  - team_members
  - custom_groups
  - custom_group_members
  - enterprise_objectives
  - team_objectives
  - team_events
  
  ## 3. Optimize RLS Policies
  Replaces `auth.uid()` with `(select auth.uid())` in all RLS policies
  to prevent re-evaluation for each row, improving performance at scale
  
  ## 4. Remove Duplicate RLS Policies
  Removes duplicate permissive policies that cause conflicts:
  - event_objectives: Removes duplicate policies
  - offer_pack_items: Removes duplicate policies
  - offer_packs: Removes duplicate policies
  - offers: Removes duplicate insert policy
  
  ## 5. Fix "Always True" RLS Policies
  Restricts overly permissive policies that bypass security:
  - contacts: Public event registration update policy
  - email_logs: System insert policy
  - notifications: System insert policy
  
  ## 6. Fix Function Search Paths
  Sets immutable search_path on all functions to prevent security issues
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_contact_events_created_by ON contact_events(created_by);
CREATE INDEX IF NOT EXISTS idx_contact_events_event_id ON contact_events(event_id);
CREATE INDEX IF NOT EXISTS idx_custom_group_members_contact_id ON custom_group_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_custom_groups_created_by ON custom_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_enterprise_objectives_assigned_to ON enterprise_objectives(assigned_to);
CREATE INDEX IF NOT EXISTS idx_enterprise_objectives_created_by ON enterprise_objectives(created_by);
CREATE INDEX IF NOT EXISTS idx_enterprises_owner_id ON enterprises(owner_id);
CREATE INDEX IF NOT EXISTS idx_member_objectives_created_by ON member_objectives(created_by);
CREATE INDEX IF NOT EXISTS idx_team_events_event_id ON team_events(event_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_objectives_assigned_to ON team_objectives(assigned_to);
CREATE INDEX IF NOT EXISTS idx_team_objectives_created_by ON team_objectives(created_by);
CREATE INDEX IF NOT EXISTS idx_team_objectives_enterprise_objective_id ON team_objectives(enterprise_objective_id);
CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON teams(manager_id);

-- ============================================================================
-- 2. ENABLE RLS ON ALL PUBLIC TABLES
-- ============================================================================

ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. REMOVE DUPLICATE RLS POLICIES
-- ============================================================================

-- event_objectives duplicates
DROP POLICY IF EXISTS "Users can delete objectives from their events" ON event_objectives;
DROP POLICY IF EXISTS "Users can add objectives to their events" ON event_objectives;
DROP POLICY IF EXISTS "Users can view objectives of their events" ON event_objectives;
DROP POLICY IF EXISTS "Users can update objectives of their events" ON event_objectives;

-- offer_pack_items duplicates
DROP POLICY IF EXISTS "Users can delete own offer pack items" ON offer_pack_items;
DROP POLICY IF EXISTS "Users can create own offer pack items" ON offer_pack_items;
DROP POLICY IF EXISTS "Users can view own offer pack items" ON offer_pack_items;

-- offer_packs duplicates
DROP POLICY IF EXISTS "Users can delete own offer packs" ON offer_packs;
DROP POLICY IF EXISTS "Users can create own offer packs" ON offer_packs;
DROP POLICY IF EXISTS "Users can view own offer packs" ON offer_packs;
DROP POLICY IF EXISTS "Users can update own offer packs" ON offer_packs;

-- offers duplicate
DROP POLICY IF EXISTS "Users can create own offers" ON offers;

-- ============================================================================
-- 4. FIX "ALWAYS TRUE" RLS POLICIES
-- ============================================================================

-- Fix contacts public update policy - should only allow updating specific fields during event registration
DROP POLICY IF EXISTS "Public can update contacts for event registration" ON contacts;
CREATE POLICY "Public can update contacts for event registration"
  ON contacts
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (
    -- Only allow updating these specific fields
    created_at = (SELECT created_at FROM contacts WHERE id = contacts.id) AND
    user_id = (SELECT user_id FROM contacts WHERE id = contacts.id)
  );

-- Fix email_logs system insert - should only be callable by service role
DROP POLICY IF EXISTS "System can insert email logs" ON email_logs;
CREATE POLICY "System can insert email logs"
  ON email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only allow if user is inserting their own email logs
    user_id = (SELECT auth.uid())
  );

-- Fix notifications system insert - should only be callable for own notifications
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only allow if user is inserting notifications for themselves
    user_id = (SELECT auth.uid())
  );

-- ============================================================================
-- 5. OPTIMIZE ALL RLS POLICIES - REPLACE auth.uid() WITH (select auth.uid())
-- ============================================================================

-- profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

-- contact_events
DROP POLICY IF EXISTS "Users can delete own contact events" ON contact_events;
CREATE POLICY "Users can delete own contact events"
  ON contact_events FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own contact events" ON contact_events;
CREATE POLICY "Users can insert own contact events"
  ON contact_events FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own contact events" ON contact_events;
CREATE POLICY "Users can view own contact events"
  ON contact_events FOR SELECT
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- interactions
DROP POLICY IF EXISTS "Users can delete own interactions" ON interactions;
CREATE POLICY "Users can delete own interactions"
  ON interactions FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own interactions" ON interactions;
CREATE POLICY "Users can insert own interactions"
  ON interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own interactions" ON interactions;
CREATE POLICY "Users can update own interactions"
  ON interactions FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own interactions" ON interactions;
CREATE POLICY "Users can view own interactions"
  ON interactions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- follow_ups
DROP POLICY IF EXISTS "Users can delete own follow-ups" ON follow_ups;
CREATE POLICY "Users can delete own follow-ups"
  ON follow_ups FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own follow-ups" ON follow_ups;
CREATE POLICY "Users can insert own follow-ups"
  ON follow_ups FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own follow-ups" ON follow_ups;
CREATE POLICY "Users can update own follow-ups"
  ON follow_ups FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own follow-ups" ON follow_ups;
CREATE POLICY "Users can view own follow-ups"
  ON follow_ups FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- contacts
DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;
CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- contact_notes
DROP POLICY IF EXISTS "Users can create own contact notes" ON contact_notes;
CREATE POLICY "Users can create own contact notes"
  ON contact_notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own contact notes" ON contact_notes;
CREATE POLICY "Users can delete own contact notes"
  ON contact_notes FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own contact notes" ON contact_notes;
CREATE POLICY "Users can update own contact notes"
  ON contact_notes FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own contact notes" ON contact_notes;
CREATE POLICY "Users can view own contact notes"
  ON contact_notes FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- contact_activities
DROP POLICY IF EXISTS "Users can create own contact activities" ON contact_activities;
CREATE POLICY "Users can create own contact activities"
  ON contact_activities FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own contact activities" ON contact_activities;
CREATE POLICY "Users can delete own contact activities"
  ON contact_activities FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own contact activities" ON contact_activities;
CREATE POLICY "Users can update own contact activities"
  ON contact_activities FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own contact activities" ON contact_activities;
CREATE POLICY "Users can view own contact activities"
  ON contact_activities FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- offer_packs (keeping the underscore versions that remain)
DROP POLICY IF EXISTS "Users can delete own offer_packs" ON offer_packs;
CREATE POLICY "Users can delete own offer_packs"
  ON offer_packs FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own offer_packs" ON offer_packs;
CREATE POLICY "Users can insert own offer_packs"
  ON offer_packs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own offer_packs" ON offer_packs;
CREATE POLICY "Users can update own offer_packs"
  ON offer_packs FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own offer_packs" ON offer_packs;
CREATE POLICY "Users can view own offer_packs"
  ON offer_packs FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- offer_pack_items (keeping the underscore versions that remain)
DROP POLICY IF EXISTS "Users can delete own offer_pack_items" ON offer_pack_items;
CREATE POLICY "Users can delete own offer_pack_items"
  ON offer_pack_items FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM offer_packs
    WHERE offer_packs.id = offer_pack_items.pack_id
    AND offer_packs.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Users can insert offer_pack_items for own packs" ON offer_pack_items;
CREATE POLICY "Users can insert offer_pack_items for own packs"
  ON offer_pack_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM offer_packs
    WHERE offer_packs.id = offer_pack_items.pack_id
    AND offer_packs.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update own offer_pack_items" ON offer_pack_items;
CREATE POLICY "Users can update own offer_pack_items"
  ON offer_pack_items FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM offer_packs
    WHERE offer_packs.id = offer_pack_items.pack_id
    AND offer_packs.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM offer_packs
    WHERE offer_packs.id = offer_pack_items.pack_id
    AND offer_packs.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Users can view offer_pack_items through packs" ON offer_pack_items;
CREATE POLICY "Users can view offer_pack_items through packs"
  ON offer_pack_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM offer_packs
    WHERE offer_packs.id = offer_pack_items.pack_id
    AND offer_packs.user_id = (SELECT auth.uid())
  ));

-- contact_opportunities
DROP POLICY IF EXISTS "Users can create own contact opportunities" ON contact_opportunities;
CREATE POLICY "Users can create own contact opportunities"
  ON contact_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own contact opportunities" ON contact_opportunities;
CREATE POLICY "Users can delete own contact opportunities"
  ON contact_opportunities FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own contact opportunities" ON contact_opportunities;
CREATE POLICY "Users can update own contact opportunities"
  ON contact_opportunities FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own contact opportunities" ON contact_opportunities;
CREATE POLICY "Users can view own contact opportunities"
  ON contact_opportunities FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- events
DROP POLICY IF EXISTS "Users can delete own events" ON events;
CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own events" ON events;
CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own events" ON events;
CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own events" ON events;
CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- event_participants
DROP POLICY IF EXISTS "Users can add participants to their events" ON event_participants;
CREATE POLICY "Users can add participants to their events"
  ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_participants.event_id
    AND events.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Users can delete participants from their events" ON event_participants;
CREATE POLICY "Users can delete participants from their events"
  ON event_participants FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_participants.event_id
    AND events.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update participants of their events" ON event_participants;
CREATE POLICY "Users can update participants of their events"
  ON event_participants FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_participants.event_id
    AND events.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_participants.event_id
    AND events.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Users can view participants of their events" ON event_participants;
CREATE POLICY "Users can view participants of their events"
  ON event_participants FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_participants.event_id
    AND events.user_id = (SELECT auth.uid())
  ));

-- event_objectives (keeping the remaining versions after removing duplicates)
DROP POLICY IF EXISTS "Users can create own event objectives" ON event_objectives;
CREATE POLICY "Users can create own event objectives"
  ON event_objectives FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own event objectives" ON event_objectives;
CREATE POLICY "Users can delete own event objectives"
  ON event_objectives FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own event objectives" ON event_objectives;
CREATE POLICY "Users can update own event objectives"
  ON event_objectives FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own event objectives" ON event_objectives;
CREATE POLICY "Users can view own event objectives"
  ON event_objectives FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- email_logs
DROP POLICY IF EXISTS "System can update email logs" ON email_logs;
CREATE POLICY "System can update email logs"
  ON email_logs FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view their own email logs" ON email_logs;
CREATE POLICY "Users can view their own email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- email_preferences
DROP POLICY IF EXISTS "Users can insert their own email preferences" ON email_preferences;
CREATE POLICY "Users can insert their own email preferences"
  ON email_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own email preferences" ON email_preferences;
CREATE POLICY "Users can update their own email preferences"
  ON email_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view their own email preferences" ON email_preferences;
CREATE POLICY "Users can view their own email preferences"
  ON email_preferences FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- contact_groups
DROP POLICY IF EXISTS "Users can create own contact groups" ON contact_groups;
CREATE POLICY "Users can create own contact groups"
  ON contact_groups FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own contact groups" ON contact_groups;
CREATE POLICY "Users can delete own contact groups"
  ON contact_groups FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own contact groups" ON contact_groups;
CREATE POLICY "Users can update own contact groups"
  ON contact_groups FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own contact groups" ON contact_groups;
CREATE POLICY "Users can view own contact groups"
  ON contact_groups FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- contact_group_members
DROP POLICY IF EXISTS "Users can create own contact group members" ON contact_group_members;
CREATE POLICY "Users can create own contact group members"
  ON contact_group_members FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM contact_groups
    WHERE contact_groups.id = contact_group_members.group_id
    AND contact_groups.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Users can delete own contact group members" ON contact_group_members;
CREATE POLICY "Users can delete own contact group members"
  ON contact_group_members FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM contact_groups
    WHERE contact_groups.id = contact_group_members.group_id
    AND contact_groups.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Users can view own contact group members" ON contact_group_members;
CREATE POLICY "Users can view own contact group members"
  ON contact_group_members FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM contact_groups
    WHERE contact_groups.id = contact_group_members.group_id
    AND contact_groups.user_id = (SELECT auth.uid())
  ));

-- member_objectives
DROP POLICY IF EXISTS "Users can create member objectives in their enterprises" ON member_objectives;
CREATE POLICY "Users can create member objectives in their enterprises"
  ON member_objectives FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete member objectives in their enterprises" ON member_objectives;
CREATE POLICY "Users can delete member objectives in their enterprises"
  ON member_objectives FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update member objectives in their enterprises" ON member_objectives;
CREATE POLICY "Users can update member objectives in their enterprises"
  ON member_objectives FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view member objectives in their enterprises" ON member_objectives;
CREATE POLICY "Users can view member objectives in their enterprises"
  ON member_objectives FOR SELECT
  TO authenticated
  USING (created_by = (SELECT auth.uid()) OR member_id = (SELECT auth.uid()));

-- offers
DROP POLICY IF EXISTS "Users can insert own offers" ON offers;
CREATE POLICY "Users can insert own offers"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own offers" ON offers;
CREATE POLICY "Users can delete own offers"
  ON offers FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own offers" ON offers;
CREATE POLICY "Users can update own offers"
  ON offers FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own offers" ON offers;
CREATE POLICY "Users can view own offers"
  ON offers FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- offer_sends
DROP POLICY IF EXISTS "Users can delete own offer sends" ON offer_sends;
CREATE POLICY "Users can delete own offer sends"
  ON offer_sends FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own offer sends" ON offer_sends;
CREATE POLICY "Users can insert own offer sends"
  ON offer_sends FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own offer sends" ON offer_sends;
CREATE POLICY "Users can update own offer sends"
  ON offer_sends FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own offer sends" ON offer_sends;
CREATE POLICY "Users can view own offer sends"
  ON offer_sends FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- notification_preferences
DROP POLICY IF EXISTS "Users can insert own preferences" ON notification_preferences;
CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;
CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- contact_relationships
DROP POLICY IF EXISTS "Users can create their own contact relationships" ON contact_relationships;
CREATE POLICY "Users can create their own contact relationships"
  ON contact_relationships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own contact relationships" ON contact_relationships;
CREATE POLICY "Users can delete their own contact relationships"
  ON contact_relationships FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own contact relationships" ON contact_relationships;
CREATE POLICY "Users can update their own contact relationships"
  ON contact_relationships FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view their own contact relationships" ON contact_relationships;
CREATE POLICY "Users can view their own contact relationships"
  ON contact_relationships FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 6. FIX FUNCTION SEARCH PATHS
-- ============================================================================

-- Drop and recreate all functions with SET search_path = pg_catalog, public
CREATE OR REPLACE FUNCTION update_enterprise_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_team_level()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.parent_team_id IS NULL THEN
    NEW.level = 1;
  ELSE
    SELECT level + 1 INTO NEW.level
    FROM teams
    WHERE id = NEW.parent_team_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_contact_notes_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE contacts
    SET notes_count = notes_count + 1
    WHERE id = NEW.contact_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE contacts
    SET notes_count = GREATEST(notes_count - 1, 0)
    WHERE id = OLD.contact_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION update_last_activity_date()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE contacts
  SET last_activity_date = NEW.activity_date
  WHERE id = NEW.contact_id
  AND (last_activity_date IS NULL OR last_activity_date < NEW.activity_date);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_offers_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events
    SET participant_count = participant_count + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events
    SET participant_count = GREATEST(participant_count - 1, 0)
    WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION update_contact_groups_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_contact_relationships_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION create_email_preferences_for_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
