-- Fix RLS policies for project-avatars bucket
-- Run this in your Supabase SQL Editor

-- First, drop any existing policies for project-avatars (if they exist)
DROP POLICY IF EXISTS "Authenticated users can upload project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete project avatars" ON storage.objects;

-- Create the correct policies for project-avatars bucket
-- 1. Allow authenticated users to upload project avatars
CREATE POLICY "Authenticated users can upload project avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-avatars' 
  AND auth.role() = 'authenticated'
);

-- 2. Allow public to read project avatars
CREATE POLICY "Public can read project avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'project-avatars');

-- 3. Allow authenticated users to update project avatars
CREATE POLICY "Authenticated users can update project avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-avatars' 
  AND auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'project-avatars' 
  AND auth.role() = 'authenticated'
);

-- 4. Allow authenticated users to delete project avatars
CREATE POLICY "Authenticated users can delete project avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-avatars' 
  AND auth.role() = 'authenticated'
);
