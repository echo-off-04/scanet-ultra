/*
  # Fix RLS Policies for Events Table

  ## Description
  Cette migration réactive RLS sur la table events et recrée les politiques
  nécessaires pour permettre aux utilisateurs de gérer leurs propres événements.

  ## Modifications
  1. Réactive RLS sur la table events
  2. Recrée les politiques CRUD pour les utilisateurs authentifiés

  ## Sécurité
  - Les utilisateurs ne peuvent voir/modifier que leurs propres événements
  - Toutes les opérations CRUD sont protégées par user_id = auth.uid()
*/

-- Réactiver RLS sur la table events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Users can insert own events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

-- Créer les politiques pour SELECT
CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Créer les politiques pour INSERT
CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Créer les politiques pour UPDATE
CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Créer les politiques pour DELETE
CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);