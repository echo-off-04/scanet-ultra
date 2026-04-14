/*
  # Corriger la Contrainte event_type

  ## Description
  Cette migration corrige la contrainte CHECK sur la colonne event_type pour accepter
  les bonnes valeurs: 'presentiel', 'online', 'hybride' (format de l'événement)
  au lieu de 'salon', 'meeting', 'conference', 'networking' (qui sont des catégories).

  ## Modifications
  1. Supprime l'ancienne contrainte events_event_type_check
  2. Met à jour les valeurs existantes
  3. Crée une nouvelle contrainte avec les bonnes valeurs

  ## Logique
  - category = type d'événement (conference, seminar, networking, salon, gala, meetup)
  - event_type = format de l'événement (presentiel, online, hybride)
*/

-- Supprimer d'abord l'ancienne contrainte
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;

-- Maintenant mettre à jour les valeurs existantes
-- On mappe les anciennes valeurs vers 'presentiel' par défaut
UPDATE events 
SET event_type = 'presentiel' 
WHERE event_type IS NULL OR event_type IN ('salon', 'meeting', 'conference', 'networking');

-- Créer la nouvelle contrainte avec les bonnes valeurs
ALTER TABLE events ADD CONSTRAINT events_event_type_check 
  CHECK (event_type IN ('presentiel', 'online', 'hybride'));

-- Mettre à jour la valeur par défaut
ALTER TABLE events ALTER COLUMN event_type SET DEFAULT 'presentiel';