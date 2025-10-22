-- =====================================================
-- Add Policies for project-avatars Bucket
-- =====================================================
-- Adds RLS policies specifically for project-avatars bucket
-- =====================================================

-- Policy: Allow authenticated users to upload to project-avatars
CREATE POLICY "Users can upload project avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-avatars' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to update project avatars
CREATE POLICY "Users can update project avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-avatars' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow public access to view project avatars
CREATE POLICY "Public can view project avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'project-avatars');

-- Policy: Allow authenticated users to delete project avatars
CREATE POLICY "Users can delete project avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-avatars' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- Verify Setup
-- =====================================================
SELECT 
  'policies_added' as status,
  'project-avatars policies created' as description;
