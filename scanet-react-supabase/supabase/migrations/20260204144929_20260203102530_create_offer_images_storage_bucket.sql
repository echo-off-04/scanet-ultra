/*
  # Création du bucket de stockage pour les images d'offres

  ## Changements
  
  1. Nouveau bucket de stockage
    - offer-images : Bucket public pour les images d'offres et de packs
  
  2. Politiques de stockage
    - Les utilisateurs authentifiés peuvent uploader des images
    - Tout le monde peut voir les images (bucket public)
    - Les utilisateurs peuvent supprimer leurs propres images
  
  3. Notes importantes
    - Les images sont organisées par user_id
    - Le bucket est public pour faciliter l'affichage des images
*/

-- Créer le bucket offer-images s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-images', 'offer-images', true)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les anciennes politiques si elles existent
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can upload offer images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own offer images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own offer images" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view offer images" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Politique pour uploader des images (authentifiés uniquement)
CREATE POLICY "Authenticated users can upload offer images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'offer-images'
);

-- Politique pour mettre à jour ses propres images
CREATE POLICY "Users can update own offer images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'offer-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'offer-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour supprimer ses propres images
CREATE POLICY "Users can delete own offer images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'offer-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour voir toutes les images (public)
CREATE POLICY "Public can view offer images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'offer-images');