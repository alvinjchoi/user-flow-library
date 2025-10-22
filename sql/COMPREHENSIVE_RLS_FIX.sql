-- Comprehensive fix for Clerk + Supabase Storage RLS issues
-- Run this in your Supabase SQL Editor

-- Option 1: Create a very permissive policy for project-avatars
-- Drop any existing policies first
DROP POLICY IF EXISTS "Clerk users can upload project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Clerk users can update project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Clerk users can delete project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete project avatars" ON storage.objects;

-- Create very permissive policies for project-avatars bucket
-- These policies allow any authenticated user (including Clerk users) to perform all operations

-- 1. Allow anyone to upload to project-avatars (very permissive)
CREATE POLICY "Anyone can upload to project-avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'project-avatars');

-- 2. Allow public to read project avatars
CREATE POLICY "Public can read project avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'project-avatars');

-- 3. Allow anyone to update project avatars
CREATE POLICY "Anyone can update project-avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'project-avatars')
WITH CHECK (bucket_id = 'project-avatars');

-- 4. Allow anyone to delete project avatars
CREATE POLICY "Anyone can delete project-avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'project-avatars');

-- Alternative Option 2: If the above doesn't work, try disabling RLS for this bucket
-- Uncomment the lines below if Option 1 doesn't work:
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
-- Then re-enable it after testing:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
