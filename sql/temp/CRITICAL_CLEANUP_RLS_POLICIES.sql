-- =============================================================================
-- CRITICAL: Remove dangerous PUBLIC policies and clean up duplicates
-- =============================================================================

-- =============================================================================
-- STEP 1: DROP ALL DANGEROUS PUBLIC POLICIES
-- =============================================================================
DROP POLICY IF EXISTS "public_read_projects" ON projects;
DROP POLICY IF EXISTS "public_insert_projects" ON projects;
DROP POLICY IF EXISTS "public_update_projects" ON projects;
DROP POLICY IF EXISTS "public_delete_projects" ON projects;

-- =============================================================================
-- STEP 2: DROP OLD/DUPLICATE POLICIES
-- =============================================================================
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
DROP POLICY IF EXISTS "Users can update accessible projects" ON projects;
DROP POLICY IF EXISTS "Users can delete accessible projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;

-- =============================================================================
-- STEP 3: Keep ONLY the new simplified policies
-- =============================================================================
-- These should already exist from your previous run:
-- ✅ select_projects_by_user_or_org
-- ✅ insert_projects
-- ✅ update_projects
-- ✅ delete_projects

-- =============================================================================
-- STEP 4: Verify - should have ONLY 4 policies
-- =============================================================================
SELECT 
  policyname,
  cmd,
  LEFT(qual::text, 100) as "policy_condition"
FROM pg_policies
WHERE tablename = 'projects'
ORDER BY policyname;

-- Expected result:
-- delete_projects                    | UPDATE | (((auth.jwt() ->> 'sub'::text) = user_id) OR ...
-- insert_projects                    | INSERT | null
-- select_projects_by_user_or_org     | SELECT | (((auth.jwt() ->> 'sub'::text) = user_id) OR ...
-- update_projects                    | UPDATE | (((auth.jwt() ->> 'sub'::text) = user_id) OR ...

-- =============================================================================
-- STEP 5: Test - should still work for authenticated users
-- =============================================================================
SELECT 
  id,
  name,
  user_id,
  clerk_org_id
FROM projects
WHERE id = 'eba8dfe2-692d-469a-b9a9-f4a26789662c';

