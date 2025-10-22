-- Simple RLS policies for project-avatars bucket (no complex auth checks)
-- Run this in your Supabase SQL Editor

-- Drop all existing policies for project-avatars
DROP POLICY IF EXISTS "Clerk authenticated users can upload project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Clerk authenticated users can update project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Clerk authenticated users can delete project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to project-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update project-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete project-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Simple project avatars upload" ON storage.objects;
DROP POLICY IF EXISTS "Simple project avatars read" ON storage.objects;
DROP POLICY IF EXISTS "Simple project avatars update" ON storage.objects;
DROP POLICY IF EXISTS "Simple project avatars delete" ON storage.objects;

-- Create very simple policies that just check the bucket
-- This should work with any authentication system

-- 1. Allow uploads to project-avatars bucket
CREATE POLICY "Allow project avatars upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'project-avatars');

-- 2. Allow public read access to project avatars
CREATE POLICY "Allow project avatars read" ON storage.objects
FOR SELECT USING (bucket_id = 'project-avatars');

-- 3. Allow updates to project avatars
CREATE POLICY "Allow project avatars update" ON storage.objects
FOR UPDATE USING (bucket_id = 'project-avatars')
WITH CHECK (bucket_id = 'project-avatars');

-- 4. Allow deletes of project avatars
CREATE POLICY "Allow project avatars delete" ON storage.objects
FOR DELETE USING (bucket_id = 'project-avatars');
