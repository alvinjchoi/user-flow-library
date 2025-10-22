-- =====================================================
-- Create project-avatars Bucket and Policies
-- =====================================================
-- Creates the bucket and proper RLS policies for project avatars
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
  'project_avatars_setup_complete' as status,
  'project-avatars bucket and policies created' as description;
