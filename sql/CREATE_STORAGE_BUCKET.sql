-- =====================================================
-- Supabase Storage Setup for Screenshots
-- =====================================================
-- Run this SQL to create the storage bucket and policies
-- =====================================================

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'screenshots',
  'screenshots',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Storage Policies
-- =====================================================

-- Allow public to read screenshots
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'screenshots');

-- Allow anyone to upload screenshots
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'screenshots');

-- Allow anyone to update screenshots  
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'screenshots')
WITH CHECK (bucket_id = 'screenshots');

-- Allow anyone to delete screenshots
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'screenshots');

-- =====================================================
-- Verify Setup
-- =====================================================
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'screenshots';

