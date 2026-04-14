/*
  # Activation du Realtime sur les tables principales

  1. Activation
    - Active le Realtime sur toutes les tables nécessaires pour les subscriptions temps réel
    
  2. Tables concernées
    - contacts - Mise à jour automatique de la liste des contacts
    - events - Mise à jour automatique des événements
    - scheduled_emails - Mise à jour automatique des emails planifiés
    - scheduled_email_recipients - Mise à jour automatique des destinataires
    - offers - Mise à jour automatique des offres
    - offer_packs - Mise à jour automatique des packs d'offres
    - offer_pack_items - Mise à jour automatique des items de packs
    - contact_opportunities - Mise à jour automatique des opportunités
    - interactions - Mise à jour automatique des interactions
    - notifications - Mise à jour automatique des notifications
    
  3. Notes importantes
    - Permet aux clients d'écouter les changements en temps réel
    - Améliore l'expérience utilisateur en évitant les rafraîchissements manuels
    - Utilise la publication `supabase_realtime` existante
*/

-- Enable realtime for contacts
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;

-- Enable realtime for events
ALTER PUBLICATION supabase_realtime ADD TABLE events;

-- Enable realtime for scheduled emails
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_emails;
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_email_recipients;

-- Enable realtime for offers
ALTER PUBLICATION supabase_realtime ADD TABLE offers;
ALTER PUBLICATION supabase_realtime ADD TABLE offer_packs;
ALTER PUBLICATION supabase_realtime ADD TABLE offer_pack_items;

-- Enable realtime for opportunities
ALTER PUBLICATION supabase_realtime ADD TABLE contact_opportunities;

-- Enable realtime for interactions
ALTER PUBLICATION supabase_realtime ADD TABLE interactions;

-- Enable realtime for notifications (should already be enabled but let's make sure)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;