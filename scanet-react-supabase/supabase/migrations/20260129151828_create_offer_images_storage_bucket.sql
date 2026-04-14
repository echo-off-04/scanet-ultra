/*
  # Create offer images storage bucket
  
  1. Storage
    - Create a new storage bucket 'offer-images' for storing offer and pack images
    - Enable public access for reading images
    - Set up RLS policies for secure image uploads
  
  2. Security
    - Users can upload images to their own folder (user_id/)
    - Images are publicly readable
    - Only authenticated users can upload
    - Users can only delete their own images
*/

-- Create the offer-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-images', 'offer-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload offer images to own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'offer-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow public read access to all offer images
CREATE POLICY "Public read access to offer images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'offer-images');

-- Policy: Allow users to update their own offer images
CREATE POLICY "Users can update own offer images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'offer-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow users to delete their own offer images
CREATE POLICY "Users can delete own offer images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'offer-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
