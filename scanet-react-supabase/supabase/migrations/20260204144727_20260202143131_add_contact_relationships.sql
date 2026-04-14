/*
  # Ajout de la table de relations entre contacts

  1. Nouvelle table
    - `contact_relationships`
      - `id` (uuid, primary key) - Identifiant unique de la relation
      - `contact_id` (uuid, foreign key) - Contact source
      - `related_contact_id` (uuid, foreign key) - Contact lié
      - `relationship_type` (text) - Type de relation (collègue, ami, famille, partenaire, client, etc.)
      - `notes` (text, optional) - Notes sur la relation
      - `user_id` (uuid, foreign key) - Propriétaire de la relation
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de mise à jour

  2. Sécurité
    - Enable RLS sur `contact_relationships`
    - Policies pour permettre aux utilisateurs de gérer leurs propres relations
    - Index pour optimiser les requêtes

  3. Notes importantes
    - Les relations sont unidirectionnelles (A -> B)
    - Contrainte pour éviter les auto-relations (contact_id != related_contact_id)
    - Contrainte unique pour éviter les doublons (contact_id, related_contact_id, user_id)
*/

-- Create contact_relationships table
CREATE TABLE IF NOT EXISTS contact_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  related_contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  relationship_type text DEFAULT 'contact',
  notes text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT no_self_relationship CHECK (contact_id != related_contact_id),
  CONSTRAINT unique_relationship UNIQUE (contact_id, related_contact_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_relationships_contact_id ON contact_relationships(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_relationships_related_contact_id ON contact_relationships(related_contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_relationships_user_id ON contact_relationships(user_id);

-- Enable RLS
ALTER TABLE contact_relationships ENABLE ROW LEVEL SECURITY;

-- Policies for contact_relationships
CREATE POLICY "Users can view their own contact relationships"
  ON contact_relationships
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own contact relationships"
  ON contact_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own contact relationships"
  ON contact_relationships
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own contact relationships"
  ON contact_relationships
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on update
CREATE TRIGGER update_contact_relationships_updated_at_trigger
  BEFORE UPDATE ON contact_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_relationships_updated_at();