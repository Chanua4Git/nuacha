-- 1. Make the receipts bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'receipts';

-- 2. Drop overly permissive SELECT policies
DROP POLICY IF EXISTS "Allow public to read receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view receipts" ON storage.objects;

-- 3. Drop existing owner-only SELECT policy if exists, then create it
DROP POLICY IF EXISTS "Users can view own receipts only" ON storage.objects;
CREATE POLICY "Users can view own receipts only"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Clean up duplicate INSERT policies and create new one
DROP POLICY IF EXISTS "Allow authenticated users to upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder only" ON storage.objects;

CREATE POLICY "Users can upload to own folder only"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 5. Ensure owner-only UPDATE and DELETE policies exist
DROP POLICY IF EXISTS "Users can update own receipts only" ON storage.objects;
CREATE POLICY "Users can update own receipts only"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own receipts only" ON storage.objects;
CREATE POLICY "Users can delete own receipts only"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);