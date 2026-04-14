/*
  # Fix Scheduled Email Automation System

  1. Configuration
    - Configure pg_cron if available
    - Create wrapper function for safe cron execution
    - Add proper error handling and logging

  2. Alternative Approaches
    - Database function that can be called from anywhere
    - Proper logging and monitoring

  3. Notes
    - pg_cron may require additional setup in Supabase dashboard
    - Function can also be called via HTTP webhook from external cron services
*/

-- Enable pg_cron extension (may require Supabase Pro plan)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron extension not available. You will need to use external cron or manual triggers.';
END $$;

-- Enable pg_net for HTTP requests (should be available on all plans)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing cron job if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('process-scheduled-emails');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS manual_process_scheduled_emails();
DROP FUNCTION IF EXISTS check_cron_status();

-- Improved trigger function with better error handling
CREATE OR REPLACE FUNCTION trigger_scheduled_email_processing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id bigint;
  v_supabase_url text;
  v_service_key text;
  v_due_count int;
  v_error_msg text;
BEGIN
  -- Check if there are any due emails first
  SELECT COUNT(*) INTO v_due_count
  FROM scheduled_emails
  WHERE status = 'pending'
  AND scheduled_for <= NOW();

  -- Exit early if no emails to process
  IF v_due_count = 0 THEN
    RAISE NOTICE 'No emails due for processing at %', NOW();
    RETURN;
  END IF;

  RAISE NOTICE 'Found % emails to process at %', v_due_count, NOW();

  -- Get Supabase URL and service key from config
  SELECT value INTO v_supabase_url FROM app_config WHERE key = 'supabase_url';
  SELECT value INTO v_service_key FROM app_config WHERE key = 'service_role_key';

  -- If not in config, try environment variables
  IF v_supabase_url IS NULL THEN
    BEGIN
      v_supabase_url := current_setting('app.supabase_url', true);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  IF v_service_key IS NULL THEN
    BEGIN
      v_service_key := current_setting('app.service_role_key', true);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  -- Log if config is missing
  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING 'Supabase configuration missing. Please configure with: SELECT set_app_config(''supabase_url'', ''https://your-project.supabase.co''); SELECT set_app_config(''service_role_key'', ''your-key'');';
    RETURN;
  END IF;

  -- Make async HTTP request to edge function
  BEGIN
    SELECT net.http_post(
      url := v_supabase_url || '/functions/v1/process-scheduled-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'triggered_by', 'cron',
        'timestamp', NOW(),
        'due_count', v_due_count
      )
    ) INTO v_request_id;

    RAISE NOTICE 'Triggered email processing. Request ID: %, Due emails: %', v_request_id, v_due_count;

  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
    RAISE WARNING 'Error triggering email processing: %', v_error_msg;
  END;

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
  RAISE WARNING 'Error in trigger_scheduled_email_processing: %', v_error_msg;
END;
$$;

-- Create the cron job (runs every minute)
DO $$
BEGIN
  PERFORM cron.schedule(
    'process-scheduled-emails',
    '* * * * *',
    'SELECT trigger_scheduled_email_processing();'
  );
  
  RAISE NOTICE 'Cron job scheduled successfully';
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not schedule cron job. pg_cron may not be available. Error: %', SQLERRM;
  RAISE NOTICE 'Alternative: Set up external cron to call POST https://your-project.supabase.co/functions/v1/process-scheduled-emails with service role key';
END $$;

-- Create a manual trigger function that can be called from the application
CREATE FUNCTION manual_process_scheduled_emails()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Call the trigger function
  PERFORM trigger_scheduled_email_processing();
  
  -- Return status
  SELECT jsonb_build_object(
    'success', true,
    'message', 'Email processing triggered',
    'timestamp', NOW()
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Create a function to check cron status
CREATE FUNCTION check_cron_status()
RETURNS TABLE(
  cron_available boolean,
  cron_scheduled boolean,
  pending_emails_count bigint,
  due_emails_count bigint,
  config_status jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cron_available boolean := false;
  v_cron_scheduled boolean := false;
  v_supabase_url text;
  v_service_key text;
BEGIN
  -- Check if pg_cron is available
  BEGIN
    PERFORM 1 FROM pg_extension WHERE extname = 'pg_cron';
    v_cron_available := true;
    
    -- Check if job is scheduled
    PERFORM 1 FROM cron.job WHERE jobname = 'process-scheduled-emails';
    v_cron_scheduled := FOUND;
  EXCEPTION WHEN OTHERS THEN
    v_cron_available := false;
  END;
  
  -- Get config status
  SELECT value INTO v_supabase_url FROM app_config WHERE key = 'supabase_url';
  SELECT value INTO v_service_key FROM app_config WHERE key = 'service_role_key';
  
  RETURN QUERY SELECT
    v_cron_available,
    v_cron_scheduled,
    (SELECT COUNT(*) FROM scheduled_emails WHERE status = 'pending'),
    (SELECT COUNT(*) FROM scheduled_emails WHERE status = 'pending' AND scheduled_for <= NOW()),
    jsonb_build_object(
      'supabase_url_configured', v_supabase_url IS NOT NULL,
      'service_key_configured', v_service_key IS NOT NULL
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION trigger_scheduled_email_processing() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION manual_process_scheduled_emails() TO postgres, service_role, authenticated;
GRANT EXECUTE ON FUNCTION check_cron_status() TO postgres, service_role, authenticated;

-- Add helpful comments
COMMENT ON FUNCTION trigger_scheduled_email_processing() IS
  'Triggers the edge function to process scheduled emails. Called by pg_cron every minute or can be triggered manually.';

COMMENT ON FUNCTION manual_process_scheduled_emails() IS
  'Manually trigger email processing. Can be called from the application or via SQL.';

COMMENT ON FUNCTION check_cron_status() IS
  'Check the status of the cron job, pending emails, and configuration.';
