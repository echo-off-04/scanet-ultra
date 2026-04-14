/*
  # Configuration du traitement automatique des emails planifiés

  1. Extensions requises
    - pg_cron : pour exécuter des tâches planifiées
    - pg_net : pour faire des requêtes HTTP vers les edge functions
    
  2. Job Cron
    - S'exécute toutes les minutes
    - Appelle la fonction edge process-scheduled-emails
    - Traite automatiquement tous les emails dont la date d'envoi est atteinte
    
  3. Fonction de traitement
    - Crée une fonction qui appelle l'edge function via HTTP
    - Utilise le service role key pour l'authentification
    - Log les erreurs pour le monitoring
    
  4. Notifications
    - Les utilisateurs reçoivent automatiquement des notifications
    - En cas de succès : notification de confirmation d'envoi
    - En cas d'échec : notification d'erreur avec détails
*/

-- Enable required extensions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    CREATE EXTENSION pg_net;
  END IF;
END $$;

-- Grant usage on pg_net schema
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

-- Function to process scheduled emails by calling edge function
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
BEGIN
  -- Check if there are any due emails first
  SELECT COUNT(*) INTO v_due_count
  FROM scheduled_emails
  WHERE status = 'pending'
  AND scheduled_for <= NOW();
  
  -- Exit early if no emails to process
  IF v_due_count = 0 THEN
    RETURN;
  END IF;
  
  -- Get Supabase URL and service key from environment
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);
  
  -- Fallback if settings are not configured
  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING 'Supabase URL or service key not configured';
    RETURN;
  END IF;
  
  -- Make async HTTP request to edge function
  SELECT net.http_post(
    url := v_supabase_url || '/functions/v1/process-scheduled-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := '{}'::jsonb
  ) INTO v_request_id;
  
  -- Log the request
  RAISE NOTICE 'Scheduled email processing triggered. Request ID: %', v_request_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Log errors but don't fail the cron job
  RAISE WARNING 'Error triggering scheduled email processing: %', SQLERRM;
END;
$$;

-- Schedule the cron job to run every minute
-- This uses pg_cron to automatically process due emails
DO $$
BEGIN
  -- Remove existing job if it exists
  PERFORM cron.unschedule('process-scheduled-emails');
EXCEPTION WHEN OTHERS THEN
  -- Job doesn't exist, continue
  NULL;
END $$;

-- Create the cron job
SELECT cron.schedule(
  'process-scheduled-emails',
  '* * * * *', -- Run every minute
  'SELECT trigger_scheduled_email_processing();'
);

-- Create a function to manually trigger email processing (for testing)
CREATE OR REPLACE FUNCTION manual_process_scheduled_emails()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
  v_due_count int;
BEGIN
  -- Count due emails
  SELECT COUNT(*) INTO v_due_count
  FROM scheduled_emails
  WHERE status = 'pending'
  AND scheduled_for <= NOW();
  
  -- Trigger processing
  PERFORM trigger_scheduled_email_processing();
  
  -- Return result
  v_result := json_build_object(
    'success', true,
    'message', 'Processing triggered',
    'due_emails', v_due_count
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION trigger_scheduled_email_processing() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION manual_process_scheduled_emails() TO authenticated, service_role;

-- Add comment
COMMENT ON FUNCTION trigger_scheduled_email_processing() IS 
  'Automatically called by pg_cron every minute to process scheduled emails that are due';
COMMENT ON FUNCTION manual_process_scheduled_emails() IS 
  'Manually trigger scheduled email processing for testing purposes';