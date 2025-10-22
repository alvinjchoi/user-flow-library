-- Investigation script for RLS policy issues with project-avatars bucket
-- Run this in your Supabase SQL Editor to debug the avatar upload issue

-- 1. Check if project-avatars bucket exists
SELECT 'BUCKET CHECK' as section, id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE name = 'project-avatars'
UNION ALL
SELECT 'ALL BUCKETS' as section, id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
ORDER BY section, name;

-- 2. Check all RLS policies for storage.objects table
SELECT 'RLS POLICIES' as section, policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects'
ORDER BY policyname;

-- 3. Check if there are any policies specifically for project-avatars
SELECT 'PROJECT-AVATARS POLICIES' as section, policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND (policyname ILIKE '%project%avatar%' OR policyname ILIKE '%project%avatars%')
ORDER BY policyname;

-- 4. Check current user authentication status
SELECT 'AUTH STATUS' as section, 
       auth.role() as current_role,
       auth.uid() as current_user_id,
       current_user as db_user;

-- 5. Check if RLS is enabled on storage.objects table
SELECT 'RLS STATUS' as section, 
       schemaname, 
       tablename, 
       rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 6. Test a simple insert to see what error we get
-- (This will likely fail, but will show us the exact error)
SELECT 'TEST INSERT' as section, 'This will show the exact RLS error when trying to insert';

-- 7. Check if there are any existing files in project-avatars bucket
SELECT 'EXISTING FILES' as section, name, bucket_id, created_at, updated_at
FROM storage.objects 
WHERE bucket_id = 'project-avatars'
ORDER BY created_at DESC
LIMIT 10;

-- 8. Check storage.objects table structure
SELECT 'TABLE STRUCTURE' as section, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'storage' AND table_name = 'objects'
ORDER BY ordinal_position;
