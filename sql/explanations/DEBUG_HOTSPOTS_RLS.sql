-- Debug RLS policy for screen_hotspots
-- This will help identify why the policy is failing

-- 1. Check JWT claims (run this while logged in)
SELECT 
  auth.jwt() ->> 'sub' as jwt_user_id,
  auth.jwt() ->> 'org_id' as jwt_org_id,
  auth.jwt() as full_jwt;

-- 2. Check a specific screen's ownership chain
-- Replace 'YOUR_SCREEN_ID' with the actual screen_id you're trying to add a hotspot to
SELECT 
  s.id as screen_id,
  s.title as screen_title,
  f.id as flow_id,
  f.name as flow_name,
  p.id as project_id,
  p.name as project_name,
  p.user_id as project_user_id,
  p.clerk_org_id as project_org_id,
  p.deleted_at as project_deleted_at,
  -- Check if current user would have access
  p.user_id = (auth.jwt() ->> 'sub')::text as matches_user_id,
  p.clerk_org_id = (auth.jwt() ->> 'org_id')::text as matches_org_id
FROM screens s
JOIN flows f ON s.flow_id = f.id
JOIN projects p ON f.project_id = p.id
WHERE s.id = 'YOUR_SCREEN_ID'; -- Replace this!

-- 3. Check all projects the current user should have access to
SELECT 
  p.id,
  p.name,
  p.user_id,
  p.clerk_org_id,
  p.deleted_at,
  CASE 
    WHEN p.user_id = (auth.jwt() ->> 'sub')::text THEN 'Personal Project'
    WHEN p.clerk_org_id = (auth.jwt() ->> 'org_id')::text THEN 'Org Project'
    ELSE 'No Access'
  END as access_type
FROM projects p
WHERE p.deleted_at IS NULL
ORDER BY p.created_at DESC;

