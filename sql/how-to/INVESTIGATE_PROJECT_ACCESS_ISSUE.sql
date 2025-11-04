-- Investigation SQL for Project Access Issues
-- Replace 'c0736d66-6c89-486f-8b4e-fd67a741380e' with your project ID if different

-- ============================================================================
-- STEP 1: Check if the project exists at all
-- ============================================================================
SELECT 
  id,
  name,
  user_id,
  clerk_org_id,
  created_at,
  deleted_at,
  is_public,
  share_token,
  avatar_url,
  color
FROM projects
WHERE id = 'c0736d66-6c89-486f-8b4e-fd67a741380e';

-- Expected outcomes:
-- - If NO ROWS: Project doesn't exist
-- - If deleted_at IS NOT NULL: Project was soft-deleted
-- - If user_id and clerk_org_id are BOTH NULL: Data integrity issue
-- - Note the user_id and clerk_org_id values for next steps


-- ============================================================================
-- STEP 2: Check who owns this project
-- ============================================================================
SELECT 
  p.id,
  p.name,
  p.user_id,
  p.clerk_org_id,
  p.deleted_at,
  CASE 
    WHEN p.clerk_org_id IS NOT NULL THEN 'Organization Project'
    WHEN p.user_id IS NOT NULL THEN 'Personal Project'
    ELSE 'INVALID - No Owner!'
  END as project_type
FROM projects p
WHERE p.id = 'c0736d66-6c89-486f-8b4e-fd67a741380e';


-- ============================================================================
-- STEP 3: Check if you're in the right organization (if it's an org project)
-- ============================================================================
-- First, see what organization this project belongs to
SELECT 
  p.clerk_org_id as project_org_id,
  p.name as project_name
FROM projects p
WHERE p.id = 'c0736d66-6c89-486f-8b4e-fd67a741380e'
  AND p.clerk_org_id IS NOT NULL;

-- Then check your current Clerk session:
-- Look at your browser console or network tab to see what orgId is being sent
-- The auth() function in Next.js returns { userId, orgId }
-- Compare the orgId from your session with project_org_id above


-- ============================================================================
-- STEP 4: Check if it's a personal project (user_id based)
-- ============================================================================
SELECT 
  p.user_id as project_owner_user_id,
  p.name as project_name
FROM projects p
WHERE p.id = 'c0736d66-6c89-486f-8b4e-fd67a741380e'
  AND p.user_id IS NOT NULL;

-- Compare this user_id with your current Clerk userId
-- You can find your userId in the Clerk dashboard or browser console


-- ============================================================================
-- STEP 5: Check related flows and screens count
-- ============================================================================
SELECT 
  p.id as project_id,
  p.name as project_name,
  COUNT(DISTINCT f.id) as total_flows,
  COUNT(DISTINCT s.id) as total_screens,
  COUNT(DISTINCT CASE WHEN f.deleted_at IS NULL THEN f.id END) as active_flows,
  COUNT(DISTINCT CASE WHEN s.deleted_at IS NULL THEN s.id END) as active_screens
FROM projects p
LEFT JOIN flows f ON f.project_id = p.id
LEFT JOIN screens s ON s.flow_id = f.id
WHERE p.id = 'c0736d66-6c89-486f-8b4e-fd67a741380e'
GROUP BY p.id, p.name;


-- ============================================================================
-- STEP 6: Check all projects you have access to (for comparison)
-- ============================================================================
-- Replace 'YOUR_USER_ID' with your actual Clerk user ID
-- Replace 'YOUR_ORG_ID' with your actual Clerk org ID (if applicable)

-- For personal projects:
SELECT 
  id,
  name,
  user_id,
  created_at,
  deleted_at
FROM projects
WHERE user_id = 'YOUR_USER_ID'  -- Replace with your actual user_id
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- For organization projects:
SELECT 
  id,
  name,
  clerk_org_id,
  created_at,
  deleted_at
FROM projects
WHERE clerk_org_id = 'YOUR_ORG_ID'  -- Replace with your actual org_id
  AND deleted_at IS NULL
ORDER BY created_at DESC;


-- ============================================================================
-- STEP 7: Check if the project is publicly shared
-- ============================================================================
SELECT 
  id,
  name,
  is_public,
  share_token,
  CASE 
    WHEN is_public THEN CONCAT('https://www.userflowlibrary.com/share/', share_token)
    ELSE 'Not publicly shared'
  END as share_url
FROM projects
WHERE id = 'c0736d66-6c89-486f-8b4e-fd67a741380e';


-- ============================================================================
-- STEP 8: Check Row Level Security (RLS) policies
-- ============================================================================
-- View all RLS policies on the projects table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'projects';


-- ============================================================================
-- DIAGNOSTIC SUMMARY QUERY
-- ============================================================================
-- This gives you everything you need in one query
WITH project_info AS (
  SELECT 
    p.*,
    COUNT(DISTINCT f.id) FILTER (WHERE f.deleted_at IS NULL) as active_flows,
    COUNT(DISTINCT s.id) FILTER (WHERE s.deleted_at IS NULL) as active_screens
  FROM projects p
  LEFT JOIN flows f ON f.project_id = p.id AND f.deleted_at IS NULL
  LEFT JOIN screens s ON s.flow_id = f.id AND s.deleted_at IS NULL
  WHERE p.id = 'c0736d66-6c89-486f-8b4e-fd67a741380e'
  GROUP BY p.id
)
SELECT 
  id,
  name,
  CASE 
    WHEN deleted_at IS NOT NULL THEN '❌ DELETED'
    ELSE '✓ Active'
  END as status,
  CASE 
    WHEN clerk_org_id IS NOT NULL THEN 'Organization Project'
    WHEN user_id IS NOT NULL THEN 'Personal Project'
    ELSE '⚠️ INVALID - No Owner'
  END as project_type,
  COALESCE(user_id, 'N/A') as user_id,
  COALESCE(clerk_org_id, 'N/A') as clerk_org_id,
  CASE 
    WHEN is_public THEN CONCAT('✓ Public - ', 'https://www.userflowlibrary.com/share/', share_token)
    ELSE '✗ Not Public'
  END as sharing_status,
  active_flows,
  active_screens,
  created_at,
  deleted_at,
  avatar_url
FROM project_info;


-- ============================================================================
-- POTENTIAL FIXES
-- ============================================================================

-- FIX 1: If the project is soft-deleted, restore it
-- UPDATE projects
-- SET deleted_at = NULL
-- WHERE id = 'c0736d66-6c89-486f-8b4e-fd67a741380e';

-- FIX 2: If ownership is wrong, reassign to yourself
-- UPDATE projects
-- SET user_id = 'YOUR_USER_ID'  -- Replace with your actual user_id
-- WHERE id = 'c0736d66-6c89-486f-8b4e-fd67a741380e';

-- FIX 3: If it should be an org project, set the org
-- UPDATE projects
-- SET clerk_org_id = 'YOUR_ORG_ID',  -- Replace with your actual org_id
--     user_id = NULL
-- WHERE id = 'c0736d66-6c89-486f-8b4e-fd67a741380e';

-- FIX 4: Enable public sharing if you want anyone to access it
-- UPDATE projects
-- SET is_public = TRUE,
--     share_token = gen_random_uuid()::text
-- WHERE id = 'c0736d66-6c89-486f-8b4e-fd67a741380e';


