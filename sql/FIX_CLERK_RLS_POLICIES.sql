-- Fix RLS policies for Clerk authentication with project-avatars bucket
-- Run this in your Supabase SQL Editor

-- First, drop any existing policies for project-avatars
DROP POLICY IF EXISTS "Authenticated users can upload project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete project avatars" ON storage.objects;

-- Create policies that work with Clerk authentication
-- Clerk users are authenticated but don't have the 'authenticated' role in Supabase
-- We need to check for auth.uid() instead of auth.role()

-- 1. Allow any authenticated user (including Clerk users) to upload project avatars
CREATE POLICY "Clerk users can upload project avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-avatars' 
  AND auth.uid() IS NOT NULL  -- This works for Clerk users
);

-- 2. Allow public to read project avatars
CREATE POLICY "Public can read project avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'project-avatars');

-- 3. Allow authenticated users to update project avatars
CREATE POLICY "Clerk users can update project avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-avatars' 
  AND auth.uid() IS NOT NULL
) WITH CHECK (
  bucket_id = 'project-avatars' 
  AND auth.uid() IS NOT NULL
);

-- 4. Allow authenticated users to delete project avatars
CREATE POLICY "Clerk users can delete project avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-avatars' 
  AND auth.uid() IS NOT NULL
);
