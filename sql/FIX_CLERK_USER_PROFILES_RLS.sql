-- Fix RLS policies for Clerk authentication with user_profiles table
-- Run this in your Supabase SQL Editor

-- First, drop any existing policies for project-avatars
DROP POLICY IF EXISTS "Anyone can upload to project-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update project-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete project-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Clerk users can upload project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Clerk users can update project avatars" ON storage.objects;
DROP POLICY IF EXISTS "Clerk users can delete project avatars" ON storage.objects;

-- Create policies that work with Clerk authentication
-- These policies check if the user exists in user_profiles table with a clerk_id

-- 1. Allow authenticated Clerk users to upload project avatars
CREATE POLICY "Clerk authenticated users can upload project avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-avatars' 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE clerk_id = auth.jwt() ->> 'sub'
  )
);

-- 2. Allow public to read project avatars
CREATE POLICY "Public can read project avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'project-avatars');

-- 3. Allow authenticated Clerk users to update project avatars
CREATE POLICY "Clerk authenticated users can update project avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-avatars' 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE clerk_id = auth.jwt() ->> 'sub'
  )
) WITH CHECK (
  bucket_id = 'project-avatars' 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE clerk_id = auth.jwt() ->> 'sub'
  )
);

-- 4. Allow authenticated Clerk users to delete project avatars
CREATE POLICY "Clerk authenticated users can delete project avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-avatars' 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE clerk_id = auth.jwt() ->> 'sub'
  )
);

-- Alternative: If the above doesn't work, try this simpler approach
-- Uncomment the lines below if the JWT approach doesn't work:

-- CREATE POLICY "Simple project avatars upload" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'project-avatars');

-- CREATE POLICY "Simple project avatars read" ON storage.objects
-- FOR SELECT USING (bucket_id = 'project-avatars');

-- CREATE POLICY "Simple project avatars update" ON storage.objects
-- FOR UPDATE USING (bucket_id = 'project-avatars')
-- WITH CHECK (bucket_id = 'project-avatars');

-- CREATE POLICY "Simple project avatars delete" ON storage.objects
-- FOR DELETE USING (bucket_id = 'project-avatars');
