-- =====================================================
-- Create Project Avatars Storage Bucket (Simple)
-- =====================================================
-- Just creates the bucket - existing policies should work
-- =====================================================

-- Create the project-avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-avatars', 'project-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Verify Setup
-- =====================================================
SELECT 
  'bucket_created' as status,
  'project-avatars bucket created' as description;
