-- Setup Email Automation Configuration
-- This script configures the automatic email processing system
-- Run this once after deploying your project

-- Set your Supabase URL (replace with your actual project URL)
-- Example: SELECT set_app_config('supabase_url', 'https://yourproject.supabase.co');
SELECT set_app_config('supabase_url', 'YOUR_SUPABASE_URL_HERE');

-- Set your Supabase Service Role Key (replace with your actual service role key)
-- You can find this in your Supabase dashboard under Settings > API
-- Example: SELECT set_app_config('service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
SELECT set_app_config('service_role_key', 'YOUR_SERVICE_ROLE_KEY_HERE');

-- Verify the configuration was set correctly
SELECT key,
       CASE
         WHEN key = 'service_role_key' THEN LEFT(value, 20) || '...'
         ELSE value
       END as value,
       updated_at
FROM app_config
WHERE key IN ('supabase_url', 'service_role_key');

-- Check if cron job is active
SELECT jobid,
       jobname,
       schedule,
       command,
       active
FROM cron.job
WHERE jobname = 'process-scheduled-emails';

-- Test the email processing function manually
-- This will process any due emails immediately
SELECT manual_process_scheduled_emails();
