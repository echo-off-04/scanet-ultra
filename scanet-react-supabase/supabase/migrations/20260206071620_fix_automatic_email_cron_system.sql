/*
  # Fix Automatic Email Cron System

  1. Configuration
    - Populate app_config with Supabase URL for the cron job
  
  2. Functions
    - Recreate trigger_scheduled_email_processing() to use net.http_post() correctly
    - Fix search_path and schema references
  
  3. Cron Job
    - Ensure pg_cron job is active and calling the correct function
*/

-- =====================================================
-- 1. POPULATE APP CONFIG WITH SUPABASE URL
-- =====================================================

INSERT INTO public.app_config (key, value, updated_at)
VALUES ('supabase_url', 'https://jciytofklfxnurmgsuwv.supabase.co', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- =====================================================
-- 2. FIX THE TRIGGER FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS public.trigger_scheduled_email_processing();

CREATE OR REPLACE FUNCTION public.trigger_scheduled_email_processing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_due_count int;
  v_supabase_url text;
  v_request_id bigint;
BEGIN
  SELECT COUNT(*) INTO v_due_count
  FROM public.scheduled_emails
  WHERE status = 'pending'
  AND scheduled_for <= NOW();

  IF v_due_count = 0 THEN
    RETURN;
  END IF;

  SELECT value INTO v_supabase_url
  FROM public.app_config
  WHERE key = 'supabase_url';

  IF v_supabase_url IS NULL THEN
    RAISE WARNING '[EmailCron] supabase_url not configured in app_config';
    RETURN;
  END IF;

  SELECT net.http_post(
    url := v_supabase_url || '/functions/v1/process-scheduled-emails',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'triggered_by', 'pg_cron',
      'due_count', v_due_count
    )
  ) INTO v_request_id;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[EmailCron] Error: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.trigger_scheduled_email_processing() TO postgres;

-- =====================================================
-- 3. ALSO FIX update_scheduled_emails_updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_scheduled_emails_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- =====================================================
-- 4. FIX process_scheduled_emails_trigger (old version)
-- =====================================================

DROP FUNCTION IF EXISTS public.process_scheduled_emails_trigger();

-- =====================================================
-- 5. FIX check_and_process_scheduled_emails
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_and_process_scheduled_emails()
RETURNS TABLE(processed integer, sent integer, failed integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  due_count int;
BEGIN
  SELECT COUNT(*) INTO due_count
  FROM public.scheduled_emails
  WHERE status = 'pending'
  AND scheduled_for <= NOW();

  IF due_count = 0 THEN
    RETURN QUERY SELECT 0, 0, 0, 'No emails due for processing'::text;
    RETURN;
  END IF;

  PERFORM public.trigger_scheduled_email_processing();

  RETURN QUERY SELECT
    due_count,
    0,
    0,
    format('Triggered processing for %s email(s)', due_count)::text;
END;
$$;

-- =====================================================
-- 6. ENSURE CRON JOB IS PROPERLY CONFIGURED
-- =====================================================

DO $$
BEGIN
  PERFORM cron.unschedule('process-scheduled-emails');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'process-scheduled-emails',
  '* * * * *',
  $$SELECT public.trigger_scheduled_email_processing()$$
);
