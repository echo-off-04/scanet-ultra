/*
  # Activation du Realtime sur contact_events

  1. Activation
    - Active le Realtime sur la table contact_events
    
  2. Table concernée
    - contact_events - Lien entre contacts et événements
    
  3. Notes
    - Permet de suivre en temps réel les associations contact-événement
*/

-- Enable realtime for contact_events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'contact_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE contact_events;
  END IF;
END $$;