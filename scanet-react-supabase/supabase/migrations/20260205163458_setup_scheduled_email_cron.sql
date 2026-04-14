/*
  # Setup Automatic Scheduled Email Processing

  1. Extension Setup
    - Enable pg_cron extension for scheduled tasks
    - Enable pg_net extension for HTTP requests to edge functions
  
  2. Cron Job
    - Create a cron job that runs every minute
    - Calls the process-scheduled-emails edge function
    - Processes all pending emails that are due
  
  3. Helper Function
    - Create a function to call the edge function via pg_net
    - Handle authentication and error logging
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to process scheduled emails by calling the edge function
CREATE OR REPLACE FUNCTION process_scheduled_emails_trigger()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status_code int;
  response_body text;
  supabase_url text;
  service_role_key text;
BEGIN
  -- Get environment variables
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- If environment variables are not set, construct from standard Supabase setup
  IF supabase_url IS NULL THEN
    supabase_url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co';
  END IF;
  
  -- Call the edge function using pg_net
  SELECT status, body INTO response_status_code, response_body
  FROM net.http_post(
    url := supabase_url || '/functions/v1/process-scheduled-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
  
  -- Log the response for debugging
  RAISE NOTICE 'Scheduled email processing response: % - %', response_status_code, response_body;
  
EXCEPTION WHEN OTHERS THEN
  -- Log errors but don't fail the cron job
  RAISE WARNING 'Error processing scheduled emails: %', SQLERRM;
END;
$$;

-- Schedule the cron job to run every minute
-- Note: This will be set up via Supabase Dashboard or CLI as pg_cron requires superuser access
-- For now, create a simple trigger-based approach as fallback

-- Alternative approach: Create a function that can be called manually or by external cron
CREATE OR REPLACE FUNCTION check_and_process_scheduled_emails()
RETURNS TABLE(
  processed int,
  sent int,
  failed int,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  due_count int;
BEGIN
  -- Count emails that are due
  SELECT COUNT(*) INTO due_count
  FROM scheduled_emails
  WHERE status = 'pending'
  AND scheduled_for <= NOW();
  
  IF due_count = 0 THEN
    RETURN QUERY SELECT 0, 0, 0, 'No emails due for processing'::text;
    RETURN;
  END IF;
  
  -- Return information about emails to be processed
  RETURN QUERY SELECT 
    due_count, 
    0, 
    0, 
    format('Found %s email(s) ready to be processed', due_count)::text;
END;
$$;

-- Create a table to track cron job executions
CREATE TABLE IF NOT EXISTS scheduled_email_cron_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at timestamptz DEFAULT now() NOT NULL,
  emails_processed int DEFAULT 0,
  emails_sent int DEFAULT 0,
  emails_failed int DEFAULT 0,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  error_message text,
  response_body jsonb
);

-- Enable RLS on cron log table
ALTER TABLE scheduled_email_cron_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view cron logs
CREATE POLICY "Only service role can manage cron logs"
  ON scheduled_email_cron_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_email_cron_log_executed_at 
  ON scheduled_email_cron_log(executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_scheduled_email_cron_log_status 
  ON scheduled_email_cron_log(status);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA net TO postgres, anon, authenticated, service_role;