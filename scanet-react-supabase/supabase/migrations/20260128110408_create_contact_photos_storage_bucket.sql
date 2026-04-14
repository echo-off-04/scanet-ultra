/*
  # Créer le Bucket de Stockage pour les Photos de Contacts

  ## Description
  Cette migration crée le bucket de stockage pour les photos de contacts
  et configure les politiques de sécurité appropriées.

  ## Modifications
  1. Crée le bucket 'contact-photos' (public)
  2. Configure les politiques d'upload pour les utilisateurs authentifiés
  3. Configure les politiques de lecture publiques

  ## Sécurité
  - Les utilisateurs authentifiés peuvent uploader des photos
  - Tout le monde peut lire les photos (bucket public)
  - Les utilisateurs peuvent supprimer leurs propres photos
*/

-- Créer le bucket s'il n'existe pas déjà
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-photos', 'contact-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre aux utilisateurs authentifiés d'uploader
CREATE POLICY "Authenticated users can upload contact photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contact-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre la lecture publique
CREATE POLICY "Public can view contact photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contact-photos');

-- Politique pour permettre aux utilisateurs de mettre à jour leurs propres photos
CREATE POLICY "Users can update own contact photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contact-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'contact-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre aux utilisateurs de supprimer leurs propres photos
CREATE POLICY "Users can delete own contact photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contact-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);