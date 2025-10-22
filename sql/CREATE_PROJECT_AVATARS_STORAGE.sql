-- =====================================================
-- Create Project Avatars Storage Bucket
-- =====================================================
-- Creates storage bucket and policies for project avatar uploads
-- =====================================================

-- Create the project-avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-avatars', 'project-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload project avatars
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
  'storage_bucket_created' as status,
  'project-avatars bucket created with proper policies' as description;
