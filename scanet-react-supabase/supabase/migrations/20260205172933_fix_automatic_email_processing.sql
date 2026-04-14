/*
  # Correction du système d'envoi automatique d'emails

  1. Configuration
    - Crée une table pour stocker la configuration Supabase (URL, clés)
    - Permet au système de cron d'accéder à ces informations

  2. Fonction de traitement améliorée
    - Utilise la configuration stockée au lieu de current_setting
    - Meilleure gestion des erreurs
    - Logs améliorés

  3. Cron job optimisé
    - S'exécute toutes les minutes
    - Traite uniquement les emails dont la date est atteinte
    - Utilise la service role key pour l'authentification
*/

-- Create configuration table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on app_config
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Only service role can access config
CREATE POLICY "Service role can manage config"
  ON app_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to set config value
CREATE OR REPLACE FUNCTION set_app_config(config_key text, config_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO app_config (key, value, updated_at)
  VALUES (config_key, config_value, now())
  ON CONFLICT (key)
  DO UPDATE SET value = EXCLUDED.value, updated_at = now();
END;
$$;

-- Function to get config value
CREATE OR REPLACE FUNCTION get_app_config(config_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_value text;
BEGIN
  SELECT value INTO config_value
  FROM app_config
  WHERE key = config_key;

  RETURN config_value;
END;
$$;

-- Improved function to process scheduled emails
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

  -- Get Supabase URL and service key from config
  SELECT value INTO v_supabase_url FROM app_config WHERE key = 'supabase_url';
  SELECT value INTO v_service_key FROM app_config WHERE key = 'service_role_key';

  -- Fallback: try environment variables via GUC (this may not work in all environments)
  IF v_supabase_url IS NULL THEN
    BEGIN
      v_supabase_url := current_setting('app.supabase_url', true);
    EXCEPTION WHEN OTHERS THEN
      v_supabase_url := NULL;
    END;
  END IF;

  IF v_service_key IS NULL THEN
    BEGIN
      v_service_key := current_setting('app.service_role_key', true);
    EXCEPTION WHEN OTHERS THEN
      v_service_key := NULL;
    END;
  END IF;

  -- If still no config, log warning and exit
  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING 'Supabase URL or service key not configured. Please run: SELECT set_app_config(''supabase_url'', ''your-url''); and SELECT set_app_config(''service_role_key'', ''your-key'');';
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
        'timestamp', now()
      )
    ) INTO v_request_id;

    -- Log the request
    RAISE NOTICE 'Scheduled email processing triggered. Due emails: %, Request ID: %', v_due_count, v_request_id;

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error making HTTP request: %', SQLERRM;
  END;

EXCEPTION WHEN OTHERS THEN
  -- Log errors but don't fail the cron job
  RAISE WARNING 'Error in trigger_scheduled_email_processing: %', SQLERRM;
END;
$$;

-- Update the cron job (remove and recreate)
DO $$
BEGIN
  -- Remove existing job if it exists
  BEGIN
    PERFORM cron.unschedule('process-scheduled-emails');
  EXCEPTION WHEN OTHERS THEN
    -- Job doesn't exist, continue
    NULL;
  END;

  -- Create the cron job
  PERFORM cron.schedule(
    'process-scheduled-emails',
    '* * * * *', -- Run every minute
    'SELECT trigger_scheduled_email_processing();'
  );

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not create cron job. pg_cron may not be available: %', SQLERRM;
END $$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION trigger_scheduled_email_processing() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION set_app_config(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION get_app_config(text) TO service_role;

-- Add helpful comments
COMMENT ON TABLE app_config IS
  'Stores application configuration like Supabase URL and keys for use by database functions';
COMMENT ON FUNCTION trigger_scheduled_email_processing() IS
  'Automatically called by pg_cron every minute to process scheduled emails that are due';
COMMENT ON FUNCTION set_app_config(text, text) IS
  'Sets a configuration value in the app_config table';
COMMENT ON FUNCTION get_app_config(text) IS
  'Gets a configuration value from the app_config table';
