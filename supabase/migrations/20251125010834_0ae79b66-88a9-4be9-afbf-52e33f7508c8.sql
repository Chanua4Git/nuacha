-- Create the learning-visuals storage bucket (public for reading)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'learning-visuals',
  'learning-visuals',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
);

-- Policy: Anyone can view learning visuals (public bucket)
CREATE POLICY "Anyone can view learning visuals"
ON storage.objects FOR SELECT
USING (bucket_id = 'learning-visuals');

-- Policy: Authenticated users can upload learning visuals
CREATE POLICY "Authenticated users can upload learning visuals"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'learning-visuals' 
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update learning visuals"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'learning-visuals' 
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can delete learning visuals
CREATE POLICY "Authenticated users can delete learning visuals"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'learning-visuals' 
  AND auth.role() = 'authenticated'
);