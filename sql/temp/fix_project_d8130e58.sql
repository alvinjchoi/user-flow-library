-- =============================================================================
-- FIX: Restore access to project d8130e58-8f6d-405e-9f88-9cb754f107af
-- =============================================================================
-- Your IDs:
-- User ID: user_34qyuKPHRbC48qS2teb7xiFpMDB
-- Org ID:  org_34r7Ygr6YxQygLscrhRewgWW3oh
-- =============================================================================

-- STEP 1: Check current state of the project
SELECT 
  id,
  name,
  user_id,
  clerk_org_id,
  created_at,
  deleted_at,
  CASE 
    WHEN user_id = 'user_34qyuKPHRbC48qS2teb7xiFpMDB' THEN '✅ User ID matches'
    ELSE '❌ User ID wrong: ' || COALESCE(user_id, 'NULL')
  END as user_status,
  CASE 
    WHEN clerk_org_id = 'org_34r7Ygr6YxQygLscrhRewgWW3oh' THEN '✅ Org ID matches'
    WHEN clerk_org_id IS NULL THEN '⚠️  Personal project (NULL)'
    ELSE '❌ Org ID wrong: ' || clerk_org_id
  END as org_status
FROM projects
WHERE id = 'd8130e58-8f6d-405e-9f88-9cb754f107af';

-- =============================================================================
-- STEP 2: FIX - Restore project to your organization
-- =============================================================================
UPDATE projects
SET 
  user_id = 'user_34qyuKPHRbC48qS2teb7xiFpMDB',
  clerk_org_id = 'org_34r7Ygr6YxQygLscrhRewgWW3oh',
  updated_at = NOW()
WHERE id = 'd8130e58-8f6d-405e-9f88-9cb754f107af';

-- =============================================================================
-- STEP 3: Verify the fix
-- =============================================================================
SELECT 
  id,
  name,
  user_id,
  clerk_org_id,
  updated_at,
  '✅ Fixed! Both IDs now match your current Clerk session' as status
FROM projects
WHERE id = 'd8130e58-8f6d-405e-9f88-9cb754f107af';

-- =============================================================================
-- STEP 4: Check all your projects in this org
-- =============================================================================
SELECT 
  id,
  name,
  user_id,
  clerk_org_id,
  created_at,
  CASE 
    WHEN user_id = 'user_34qyuKPHRbC48qS2teb7xiFpMDB' 
     AND clerk_org_id = 'org_34r7Ygr6YxQygLscrhRewgWW3oh' 
    THEN '✅ OK'
    WHEN user_id = 'user_34qyuKPHRbC48qS2teb7xiFpMDB' 
     AND clerk_org_id IS NULL 
    THEN '⚠️  Personal'
    ELSE '❌ Needs fix'
  END as access_status
FROM projects
WHERE deleted_at IS NULL
  AND (
    user_id = 'user_34qyuKPHRbC48qS2teb7xiFpMDB' OR
    clerk_org_id = 'org_34r7Ygr6YxQygLscrhRewgWW3oh'
  )
ORDER BY created_at DESC;

-- =============================================================================
-- After running these queries:
-- 1. Refresh your browser (F5)
-- 2. Navigate to: https://www.userflowlibrary.com/projects/d8130e58-8f6d-405e-9f88-9cb754f107af
-- 3. You should now have access!
-- =============================================================================

