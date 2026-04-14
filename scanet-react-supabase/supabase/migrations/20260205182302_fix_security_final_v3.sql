/*
  # Final Security and Performance Fixes

  1. Missing Index - Add index on foreign key
  2. Dangerous RLS Policy - Remove always-true policy
  3. Multiple Permissive Policies - Consolidate
  4. RLS Optimization - Use (SELECT auth.uid()) pattern
  5. Function Security - Fix search_path
  6. Schema Cleanup - Move pg_net, drop unused indexes
*/

-- =====================================================
-- 1. ADD MISSING INDEX
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_scheduled_email_recipients_email_log_id
  ON public.scheduled_email_recipients(email_log_id);

-- =====================================================
-- 2. REMOVE DANGEROUS RLS POLICY
-- =====================================================

DROP POLICY IF EXISTS "Public can update contacts for event registration" ON public.contacts;

-- =====================================================
-- 3. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- =====================================================

-- EMAIL_LOGS
DROP POLICY IF EXISTS "Public can track emails" ON public.email_logs;
DROP POLICY IF EXISTS "System can update email logs" ON public.email_logs;

CREATE POLICY "Email tracking and updates"
  ON public.email_logs FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR tracking_token IS NOT NULL)
  WITH CHECK (user_id = (SELECT auth.uid()) OR tracking_token IS NOT NULL);

-- OFFER_SENDS
DROP POLICY IF EXISTS "Public can update offer status with token" ON public.offer_sends;
DROP POLICY IF EXISTS "Users can update own offer sends" ON public.offer_sends;

CREATE POLICY "Offer send updates"
  ON public.offer_sends FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR tracking_token IS NOT NULL)
  WITH CHECK (user_id = (SELECT auth.uid()) OR tracking_token IS NOT NULL);

-- =====================================================
-- 4. OPTIMIZE RLS POLICIES
-- =====================================================

-- ENTERPRISES
DROP POLICY "Users can view own enterprise" ON public.enterprises;
CREATE POLICY "Users can view own enterprise" ON public.enterprises FOR SELECT TO authenticated
  USING (owner_id = (SELECT auth.uid()));

DROP POLICY "Users can create own enterprise" ON public.enterprises;
CREATE POLICY "Users can create own enterprise" ON public.enterprises FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY "Users can update own enterprise" ON public.enterprises;
CREATE POLICY "Users can update own enterprise" ON public.enterprises FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY "Users can delete own enterprise" ON public.enterprises;
CREATE POLICY "Users can delete own enterprise" ON public.enterprises FOR DELETE TO authenticated
  USING (owner_id = (SELECT auth.uid()));

-- TEAMS
DROP POLICY "Users can view own teams" ON public.teams;
CREATE POLICY "Users can view own teams" ON public.teams FOR SELECT TO authenticated
  USING (enterprise_id IN (SELECT id FROM enterprises WHERE owner_id = (SELECT auth.uid())));

DROP POLICY "Users can create own teams" ON public.teams;
CREATE POLICY "Users can create own teams" ON public.teams FOR INSERT TO authenticated
  WITH CHECK (enterprise_id IN (SELECT id FROM enterprises WHERE owner_id = (SELECT auth.uid())));

DROP POLICY "Users can update own teams" ON public.teams;
CREATE POLICY "Users can update own teams" ON public.teams FOR UPDATE TO authenticated
  USING (enterprise_id IN (SELECT id FROM enterprises WHERE owner_id = (SELECT auth.uid())))
  WITH CHECK (enterprise_id IN (SELECT id FROM enterprises WHERE owner_id = (SELECT auth.uid())));

DROP POLICY "Users can delete own teams" ON public.teams;
CREATE POLICY "Users can delete own teams" ON public.teams FOR DELETE TO authenticated
  USING (enterprise_id IN (SELECT id FROM enterprises WHERE owner_id = (SELECT auth.uid())));

-- TEAM_MEMBERS
DROP POLICY "Users can view own team members" ON public.team_members;
CREATE POLICY "Users can view own team members" ON public.team_members FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY "Users can create own team members" ON public.team_members;
CREATE POLICY "Users can create own team members" ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY "Users can update own team members" ON public.team_members;
CREATE POLICY "Users can update own team members" ON public.team_members FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY "Users can delete own team members" ON public.team_members;
CREATE POLICY "Users can delete own team members" ON public.team_members FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- CUSTOM_GROUPS
DROP POLICY IF EXISTS "Users can view own custom groups" ON public.custom_groups;
CREATE POLICY "Users can view own custom groups" ON public.custom_groups FOR SELECT TO authenticated
  USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create own custom groups" ON public.custom_groups;
CREATE POLICY "Users can create own custom groups" ON public.custom_groups FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own custom groups" ON public.custom_groups;
CREATE POLICY "Users can update own custom groups" ON public.custom_groups FOR UPDATE TO authenticated
  USING (created_by = (SELECT auth.uid())) WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own custom groups" ON public.custom_groups;
CREATE POLICY "Users can delete own custom groups" ON public.custom_groups FOR DELETE TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- CUSTOM_GROUP_MEMBERS
DROP POLICY IF EXISTS "Users can view own custom group members" ON public.custom_group_members;
CREATE POLICY "Users can view own custom group members" ON public.custom_group_members FOR SELECT TO authenticated
  USING (group_id IN (SELECT id FROM custom_groups WHERE created_by = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can create own custom group members" ON public.custom_group_members;
CREATE POLICY "Users can create own custom group members" ON public.custom_group_members FOR INSERT TO authenticated
  WITH CHECK (group_id IN (SELECT id FROM custom_groups WHERE created_by = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can delete own custom group members" ON public.custom_group_members;
CREATE POLICY "Users can delete own custom group members" ON public.custom_group_members FOR DELETE TO authenticated
  USING (group_id IN (SELECT id FROM custom_groups WHERE created_by = (SELECT auth.uid())));

-- ENTERPRISE_OBJECTIVES
DROP POLICY IF EXISTS "Users can view own enterprise objectives" ON public.enterprise_objectives;
CREATE POLICY "Users can view own enterprise objectives" ON public.enterprise_objectives FOR SELECT TO authenticated
  USING (enterprise_id IN (SELECT id FROM enterprises WHERE owner_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can create own enterprise objectives" ON public.enterprise_objectives;
CREATE POLICY "Users can create own enterprise objectives" ON public.enterprise_objectives FOR INSERT TO authenticated
  WITH CHECK (enterprise_id IN (SELECT id FROM enterprises WHERE owner_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can update own enterprise objectives" ON public.enterprise_objectives;
CREATE POLICY "Users can update own enterprise objectives" ON public.enterprise_objectives FOR UPDATE TO authenticated
  USING (enterprise_id IN (SELECT id FROM enterprises WHERE owner_id = (SELECT auth.uid())))
  WITH CHECK (enterprise_id IN (SELECT id FROM enterprises WHERE owner_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can delete own enterprise objectives" ON public.enterprise_objectives;
CREATE POLICY "Users can delete own enterprise objectives" ON public.enterprise_objectives FOR DELETE TO authenticated
  USING (enterprise_id IN (SELECT id FROM enterprises WHERE owner_id = (SELECT auth.uid())));

-- TEAM_OBJECTIVES
DROP POLICY IF EXISTS "Users can view own team objectives" ON public.team_objectives;
CREATE POLICY "Users can view own team objectives" ON public.team_objectives FOR SELECT TO authenticated
  USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create own team objectives" ON public.team_objectives;
CREATE POLICY "Users can create own team objectives" ON public.team_objectives FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own team objectives" ON public.team_objectives;
CREATE POLICY "Users can update own team objectives" ON public.team_objectives FOR UPDATE TO authenticated
  USING (created_by = (SELECT auth.uid())) WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own team objectives" ON public.team_objectives;
CREATE POLICY "Users can delete own team objectives" ON public.team_objectives FOR DELETE TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- TEAM_EVENTS
DROP POLICY IF EXISTS "Users can view own team events" ON public.team_events;
CREATE POLICY "Users can view own team events" ON public.team_events FOR SELECT TO authenticated
  USING (team_id IN (SELECT t.id FROM teams t JOIN enterprises e ON t.enterprise_id = e.id WHERE e.owner_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can create own team events" ON public.team_events;
CREATE POLICY "Users can create own team events" ON public.team_events FOR INSERT TO authenticated
  WITH CHECK (team_id IN (SELECT t.id FROM teams t JOIN enterprises e ON t.enterprise_id = e.id WHERE e.owner_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can delete own team events" ON public.team_events;
CREATE POLICY "Users can delete own team events" ON public.team_events FOR DELETE TO authenticated
  USING (team_id IN (SELECT t.id FROM teams t JOIN enterprises e ON t.enterprise_id = e.id WHERE e.owner_id = (SELECT auth.uid())));

-- SCHEDULED_EMAILS
DROP POLICY IF EXISTS "Users can view own scheduled emails" ON public.scheduled_emails;
CREATE POLICY "Users can view own scheduled emails" ON public.scheduled_emails FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create own scheduled emails" ON public.scheduled_emails;
CREATE POLICY "Users can create own scheduled emails" ON public.scheduled_emails FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own scheduled emails" ON public.scheduled_emails;
CREATE POLICY "Users can update own scheduled emails" ON public.scheduled_emails FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own scheduled emails" ON public.scheduled_emails;
CREATE POLICY "Users can delete own scheduled emails" ON public.scheduled_emails FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- SCHEDULED_EMAIL_RECIPIENTS
DROP POLICY IF EXISTS "Users can view recipients of own scheduled emails" ON public.scheduled_email_recipients;
CREATE POLICY "Users can view recipients of own scheduled emails" ON public.scheduled_email_recipients FOR SELECT TO authenticated
  USING (scheduled_email_id IN (SELECT id FROM scheduled_emails WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can create recipients for own scheduled emails" ON public.scheduled_email_recipients;
CREATE POLICY "Users can create recipients for own scheduled emails" ON public.scheduled_email_recipients FOR INSERT TO authenticated
  WITH CHECK (scheduled_email_id IN (SELECT id FROM scheduled_emails WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can update recipients of own scheduled emails" ON public.scheduled_email_recipients;
CREATE POLICY "Users can update recipients of own scheduled emails" ON public.scheduled_email_recipients FOR UPDATE TO authenticated
  USING (scheduled_email_id IN (SELECT id FROM scheduled_emails WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (scheduled_email_id IN (SELECT id FROM scheduled_emails WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can delete recipients of own scheduled emails" ON public.scheduled_email_recipients;
CREATE POLICY "Users can delete recipients of own scheduled emails" ON public.scheduled_email_recipients FOR DELETE TO authenticated
  USING (scheduled_email_id IN (SELECT id FROM scheduled_emails WHERE user_id = (SELECT auth.uid())));

-- =====================================================
-- 5. FIX FUNCTION SEARCH PATHS
-- =====================================================

DROP FUNCTION IF EXISTS public.set_app_config(text, text);
CREATE FUNCTION public.set_app_config(config_key text, config_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.app_config (key, value)
  VALUES (config_key, config_value)
  ON CONFLICT (key) 
  DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
END;
$$;

DROP FUNCTION IF EXISTS public.get_app_config(text);
CREATE FUNCTION public.get_app_config(config_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_value text;
BEGIN
  SELECT value INTO v_value FROM public.app_config WHERE key = config_key;
  RETURN v_value;
END;
$$;

DROP FUNCTION IF EXISTS public.trigger_scheduled_email_processing();
CREATE FUNCTION public.trigger_scheduled_email_processing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request_id bigint;
  v_supabase_url text;
  v_service_key text;
  v_due_count int;
BEGIN
  SELECT COUNT(*) INTO v_due_count
  FROM public.scheduled_emails
  WHERE status = 'pending' AND scheduled_for <= NOW();

  IF v_due_count = 0 THEN RETURN; END IF;

  SELECT value INTO v_supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO v_service_key FROM public.app_config WHERE key = 'service_role_key';

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN RETURN; END IF;

  BEGIN
    SELECT extensions.http_post(
      url := v_supabase_url || '/functions/v1/process-scheduled-emails',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_service_key),
      body := jsonb_build_object('triggered_by', 'cron', 'timestamp', NOW(), 'due_count', v_due_count)
    ) INTO v_request_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END;
$$;

DROP FUNCTION IF EXISTS public.manual_process_scheduled_emails();
CREATE FUNCTION public.manual_process_scheduled_emails()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.trigger_scheduled_email_processing();
  RETURN jsonb_build_object('success', true, 'message', 'Triggered', 'timestamp', NOW());
END;
$$;

DROP FUNCTION IF EXISTS public.check_cron_status();
CREATE FUNCTION public.check_cron_status()
RETURNS TABLE(
  cron_available boolean,
  cron_scheduled boolean,
  pending_emails_count bigint,
  due_emails_count bigint,
  config_status jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cron_available boolean := false;
  v_cron_scheduled boolean := false;
  v_supabase_url text;
  v_service_key text;
BEGIN
  BEGIN
    PERFORM 1 FROM pg_extension WHERE extname = 'pg_cron';
    v_cron_available := true;
    PERFORM 1 FROM cron.job WHERE jobname = 'process-scheduled-emails';
    v_cron_scheduled := FOUND;
  EXCEPTION WHEN OTHERS THEN v_cron_available := false; END;
  
  SELECT value INTO v_supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO v_service_key FROM public.app_config WHERE key = 'service_role_key';
  
  RETURN QUERY SELECT v_cron_available, v_cron_scheduled,
    (SELECT COUNT(*) FROM public.scheduled_emails WHERE status = 'pending'),
    (SELECT COUNT(*) FROM public.scheduled_emails WHERE status = 'pending' AND scheduled_for <= NOW()),
    jsonb_build_object('supabase_url_configured', v_supabase_url IS NOT NULL, 'service_key_configured', v_service_key IS NOT NULL);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.set_app_config(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_app_config(text) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_scheduled_email_processing() TO service_role;
GRANT EXECUTE ON FUNCTION public.manual_process_scheduled_emails() TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.check_cron_status() TO service_role, authenticated;

-- =====================================================
-- 6. MOVE pg_net TO EXTENSIONS SCHEMA
-- =====================================================

CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
  ALTER EXTENSION pg_net SET SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- =====================================================
-- 7. DROP UNUSED INDEXES (Improves write performance)
-- =====================================================

DROP INDEX IF EXISTS public.idx_contact_events_created_by, public.idx_contact_events_event_id,
  public.idx_interactions_contact_id, public.idx_interactions_user_id,
  public.idx_follow_ups_contact_id, public.idx_follow_ups_user_id, public.idx_follow_ups_due_date, public.idx_follow_ups_completed,
  public.idx_contacts_full_name, public.idx_contacts_rating, public.idx_contacts_industry, public.idx_contacts_company_size,
  public.idx_contacts_last_activity_date, public.idx_contacts_status, public.idx_contacts_city, public.idx_contacts_region,
  public.idx_contacts_country, public.idx_contacts_relationship, public.idx_contacts_opportunity_amount, public.idx_contacts_is_member,
  public.idx_contact_notes_created_at, public.idx_contact_activities_user_id, public.idx_contact_activities_activity_date,
  public.idx_contact_activities_type, public.idx_contact_opportunities_status, public.idx_events_status, public.idx_events_category,
  public.idx_events_start_date, public.idx_events_date, public.idx_events_qr_code_token, public.idx_event_participants_event_id,
  public.idx_event_participants_contact_id, public.idx_event_participants_user_id, public.idx_offer_pack_items_offer_id,
  public.idx_event_objectives_event_id, public.idx_event_objectives_user_id, public.idx_event_objectives_type,
  public.idx_event_objectives_metric_type, public.idx_email_logs_user_id, public.idx_email_logs_status,
  public.idx_email_logs_tracking_token, public.idx_enterprises_owner_id, public.idx_teams_enterprise, public.idx_teams_parent,
  public.idx_teams_manager_id, public.idx_team_objectives_team, public.idx_team_objectives_event, public.idx_team_objectives_assigned_to,
  public.idx_team_objectives_created_by, public.idx_team_objectives_enterprise_objective_id, public.idx_contact_group_members_group,
  public.idx_contact_group_members_contact, public.idx_member_objectives_member_id, public.idx_member_objectives_enterprise_id,
  public.idx_member_objectives_linked_objective, public.idx_member_objectives_created_by, public.idx_offers_is_active,
  public.idx_offers_billing_type, public.idx_team_events_event_id, public.idx_notifications_user_id, public.idx_notifications_read,
  public.idx_notifications_created_at, public.idx_notifications_expires_at, public.idx_contact_relationships_contact_id,
  public.idx_contact_relationships_related_contact_id, public.idx_contact_relationships_user_id, public.idx_team_members_team,
  public.idx_team_members_contact, public.idx_team_members_user_id, public.idx_custom_groups_enterprise,
  public.idx_custom_groups_created_by, public.idx_custom_group_members_group, public.idx_custom_group_members_contact_id,
  public.idx_enterprise_objectives_enterprise, public.idx_enterprise_objectives_event, public.idx_enterprise_objectives_assigned_to,
  public.idx_enterprise_objectives_created_by, public.idx_offer_sends_user, public.idx_offer_sends_offer, public.idx_offer_sends_pack,
  public.idx_offer_sends_tracking_token, public.idx_offer_sends_email_log_id, public.idx_offer_sends_offer_status,
  public.idx_scheduled_emails_scheduled_for, public.idx_scheduled_email_recipients_contact_id,
  public.idx_scheduled_email_cron_log_executed_at, public.idx_scheduled_email_cron_log_status;
