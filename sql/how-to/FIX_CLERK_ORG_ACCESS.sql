-- =============================================================================
-- FIX: Can't access projects after changing clerk_org_id
-- =============================================================================
-- ISSUE: When you manually change clerk_org_id in Supabase and change it back,
--        you still can't access the project. This is due to RLS policies.
-- =============================================================================

-- STEP 1: Check current RLS policies
-- This will show you all the security policies on the projects table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual AS "using_condition",
  with_check
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY policyname;

-- =============================================================================
-- STEP 2: Find your current user_id and org_id from Clerk
-- =============================================================================
-- Run this in your Next.js app console to get your current IDs:
-- 
-- import { auth } from '@clerk/nextjs/server';
-- const { userId, orgId } = await auth();
-- console.log({ userId, orgId });
--
-- OR check the /dashboard page logs for "Loading projects for: {userId, orgId, orgName}"
-- =============================================================================

-- STEP 3: Find projects that you should have access to
-- Replace 'YOUR_USER_ID' and 'YOUR_ORG_ID' with actual values from Step 2
SELECT 
  id,
  name,
  user_id,
  clerk_org_id,
  created_at,
  CASE 
    WHEN user_id = 'YOUR_USER_ID' THEN '✅ Owned by you'
    WHEN clerk_org_id = 'YOUR_ORG_ID' THEN '✅ In your org'
    ELSE '❌ No access'
  END as access_status
FROM projects
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- =============================================================================
-- STEP 4A: FIX - If project should belong to your personal account
-- =============================================================================
-- Replace 'PROJECT_ID' with the actual project ID from Step 3
-- Replace 'YOUR_USER_ID' with your actual user ID from Step 2
UPDATE projects
SET 
  clerk_org_id = NULL,  -- NULL = personal project
  user_id = 'YOUR_USER_ID',
  updated_at = NOW()
WHERE id = 'PROJECT_ID';

-- Verify the fix
SELECT id, name, user_id, clerk_org_id 
FROM projects 
WHERE id = 'PROJECT_ID';

-- =============================================================================
-- STEP 4B: FIX - If project should belong to your organization
-- =============================================================================
-- Replace 'PROJECT_ID' with the actual project ID from Step 3
-- Replace 'YOUR_USER_ID' and 'YOUR_ORG_ID' with actual values from Step 2
UPDATE projects
SET 
  clerk_org_id = 'YOUR_ORG_ID',
  user_id = 'YOUR_USER_ID',
  updated_at = NOW()
WHERE id = 'PROJECT_ID';

-- Verify the fix
SELECT id, name, user_id, clerk_org_id 
FROM projects 
WHERE id = 'PROJECT_ID';

-- =============================================================================
-- STEP 5: Check if RLS policies are correct
-- =============================================================================
-- This query shows you exactly what the RLS policy is checking
SELECT 
  policyname,
  cmd,
  qual AS "RLS_condition"
FROM pg_policies 
WHERE tablename = 'projects' 
  AND cmd = 'SELECT';

-- =============================================================================
-- EXPECTED RLS POLICY:
-- =============================================================================
-- The policy should allow access if EITHER:
-- 1. user_id matches your Clerk user ID (personal projects)
-- 2. clerk_org_id matches your current organization ID
--
-- Policy condition should look like:
-- (
--   (user_id = (auth.jwt() -> 'sub')::text) OR
--   (clerk_org_id = (auth.jwt() -> 'org_id')::text)
-- )
-- =============================================================================

-- =============================================================================
-- STEP 6: If RLS policies are missing or incorrect, recreate them
-- =============================================================================
-- WARNING: Only run this if Step 5 shows the policies are wrong or missing!

-- Drop existing policies (if needed)
DROP POLICY IF EXISTS "Users can view projects they own or are in their org" ON projects;
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects they own or are in their org" ON projects;
DROP POLICY IF EXISTS "Users can delete projects they own or are in their org" ON projects;

-- Recreate correct RLS policies
CREATE POLICY "Users can view projects they own or are in their org"
ON projects FOR SELECT
USING (
  deleted_at IS NULL AND (
    user_id = (auth.jwt() -> 'sub')::text OR
    clerk_org_id = (auth.jwt() -> 'org_id')::text
  )
);

CREATE POLICY "Users can insert projects"
ON projects FOR INSERT
WITH CHECK (
  user_id = (auth.jwt() -> 'sub')::text
);

CREATE POLICY "Users can update projects they own or are in their org"
ON projects FOR UPDATE
USING (
  user_id = (auth.jwt() -> 'sub')::text OR
  clerk_org_id = (auth.jwt() -> 'org_id')::text
)
WITH CHECK (
  user_id = (auth.jwt() -> 'sub')::text OR
  clerk_org_id = (auth.jwt() -> 'org_id')::text
);

CREATE POLICY "Users can delete projects they own or are in their org"
ON projects FOR DELETE
USING (
  user_id = (auth.jwt() -> 'sub')::text OR
  clerk_org_id = (auth.jwt() -> 'org_id')::text
);

-- =============================================================================
-- STEP 7: Verify the fix worked
-- =============================================================================
-- After updating the project, refresh your app and check if you can access it
-- If still having issues, check the browser console for any JWT errors

-- Check your JWT claims in the app:
-- Look for console logs like: "[ProjectPage] Loading project data with auth: {userId, orgId, orgName}"
-- Make sure these match the user_id and clerk_org_id in the database

-- =============================================================================
-- COMMON ISSUES:
-- =============================================================================
-- 1. **Wrong org_id**: Make sure you're in the correct organization in Clerk
--    - Check the OrganizationSwitcher in the navbar
--    - The org_id in Clerk must match clerk_org_id in database
--
-- 2. **JWT not updated**: After changing clerk_org_id, you may need to:
--    - Sign out and sign back in
--    - Clear browser cache
--    - Wait a few minutes for JWT to refresh
--
-- 3. **NULL values**: 
--    - user_id = NULL means no owner (BAD!)
--    - clerk_org_id = NULL means personal project (OK if user_id is set)
--
-- 4. **Case sensitivity**: Clerk IDs are case-sensitive!
--    - user_2abc123 ≠ USER_2abc123
--    - org_2xyz456 ≠ ORG_2xyz456
-- =============================================================================

-- =============================================================================
-- PREVENTION: Avoid manual changes!
-- =============================================================================
-- Instead of manually changing clerk_org_id in Supabase, use the app's
-- organization management features or create a migration script.
--
-- If you need to move a project between orgs, create a proper SQL migration:
-- 1. Backup the project data
-- 2. Update with correct user_id AND clerk_org_id
-- 3. Verify access immediately
-- 4. Never set just one field - always set both!
-- =============================================================================

