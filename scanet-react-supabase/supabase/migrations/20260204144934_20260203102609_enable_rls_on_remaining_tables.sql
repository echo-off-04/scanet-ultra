/*
  # Activation de RLS sur les tables restantes

  ## Changements
  
  1. Activation de RLS sur les tables qui ont déjà des politiques
    - profiles
    - contacts
    - contact_events
    - interactions
    - follow_ups
  
  2. Notes importantes
    - Ces tables ont déjà des politiques définies
    - L'activation de RLS permettra à ces politiques d'être appliquées
    - Cela corrige les problèmes d'insertion/mise à jour
    - Les données existantes restent intactes
*/

-- Activer RLS sur profiles (les politiques existent déjà)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur contacts (les politiques existent déjà)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur contact_events (les politiques existent déjà)
ALTER TABLE contact_events ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur interactions (les politiques existent déjà)
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur follow_ups (les politiques existent déjà)
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;