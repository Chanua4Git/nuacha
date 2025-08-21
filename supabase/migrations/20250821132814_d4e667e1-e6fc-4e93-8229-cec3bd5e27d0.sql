-- Make receipts bucket public so receipt images can be displayed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'receipts';

-- Add RLS policies for receipt access
CREATE POLICY "Allow authenticated users to view receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to upload their own receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to update their own receipts" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to delete their own receipts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);