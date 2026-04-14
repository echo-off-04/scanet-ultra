/*
  # Fix Cron Trigger to Include Email Sequence Sends

  1. Problem
    - The cron trigger function only checked `scheduled_emails` for pending items
    - If no regular scheduled emails were pending, it returned early
    - This meant `email_sequence_sends` were never processed by the edge function

  2. Fix
    - Count BOTH `scheduled_emails` AND `email_sequence_sends` pending items
    - Call the edge function if either table has pending sends due
    - Pass both counts in the request body for transparency
*/

DROP FUNCTION IF EXISTS public.trigger_scheduled_email_processing();

CREATE OR REPLACE FUNCTION public.trigger_scheduled_email_processing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_scheduled_count int;
  v_sequence_count int;
  v_total_count int;
  v_supabase_url text;
  v_request_id bigint;
BEGIN
  SELECT COUNT(*) INTO v_scheduled_count
  FROM public.scheduled_emails
  WHERE status = 'pending'
  AND scheduled_for <= NOW();

  SELECT COUNT(*) INTO v_sequence_count
  FROM public.email_sequence_sends
  WHERE status = 'pending'
  AND scheduled_for <= NOW();

  v_total_count := v_scheduled_count + v_sequence_count;

  IF v_total_count = 0 THEN
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
      'scheduled_count', v_scheduled_count,
      'sequence_count', v_sequence_count,
      'due_count', v_total_count
    )
  ) INTO v_request_id;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[EmailCron] Error: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.trigger_scheduled_email_processing() TO postgres;

CREATE OR REPLACE FUNCTION public.check_and_process_scheduled_emails()
RETURNS TABLE(processed integer, sent integer, failed integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  scheduled_due int;
  sequence_due int;
  total_due int;
BEGIN
  SELECT COUNT(*) INTO scheduled_due
  FROM public.scheduled_emails
  WHERE status = 'pending'
  AND scheduled_for <= NOW();

  SELECT COUNT(*) INTO sequence_due
  FROM public.email_sequence_sends
  WHERE status = 'pending'
  AND scheduled_for <= NOW();

  total_due := scheduled_due + sequence_due;

  IF total_due = 0 THEN
    RETURN QUERY SELECT 0, 0, 0, 'No emails due for processing'::text;
    RETURN;
  END IF;

  PERFORM public.trigger_scheduled_email_processing();

  RETURN QUERY SELECT
    total_due,
    0,
    0,
    format('Triggered processing for %s email(s) (%s scheduled, %s sequence)', total_due, scheduled_due, sequence_due)::text;
END;
$$;
