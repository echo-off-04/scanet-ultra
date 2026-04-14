/*
  # Créer le Bucket de Stockage pour les Images d'Événements

  ## Description
  Cette migration crée le bucket de stockage pour les images d'événements
  et configure les politiques de sécurité appropriées.

  ## Modifications
  1. Crée le bucket 'event-images' (public)
  2. Configure les politiques d'upload pour les utilisateurs authentifiés
  3. Configure les politiques de lecture publiques

  ## Sécurité
  - Les utilisateurs authentifiés peuvent uploader des images
  - Tout le monde peut lire les images (bucket public)
  - Les utilisateurs peuvent supprimer leurs propres images
*/

-- Créer le bucket s'il n'existe pas déjà
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre aux utilisateurs authentifiés d'uploader
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre la lecture publique
CREATE POLICY "Public can view event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- Politique pour permettre aux utilisateurs de mettre à jour leurs propres images
CREATE POLICY "Users can update own event images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'event-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre aux utilisateurs de supprimer leurs propres images
CREATE POLICY "Users can delete own event images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);