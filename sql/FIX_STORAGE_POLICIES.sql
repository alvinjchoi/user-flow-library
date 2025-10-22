-- =====================================================
-- Fix Storage Policies for Screenshot Upload
-- =====================================================
-- Run this if you're getting RLS policy errors
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- Recreate with correct syntax
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'screenshots');

CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'screenshots');

CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'screenshots')
WITH CHECK (bucket_id = 'screenshots');

CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'screenshots');

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';

