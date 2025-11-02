-- =====================================================
-- Combined Setup: User Ownership + Clerk Organizations
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- ========================================
-- STEP 1: Add user_id column
-- ========================================
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- ========================================
-- STEP 2: Add clerk_org_id column
-- ========================================
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS clerk_org_id TEXT;

-- ========================================
-- STEP 3: Create indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_clerk_org_id ON projects(clerk_org_id);

-- ========================================
-- STEP 4: Update RLS Policies
-- ========================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
DROP POLICY IF EXISTS "Users can update accessible projects" ON projects;
DROP POLICY IF EXISTS "Users can delete accessible projects" ON projects;

-- SELECT: Users can view personal projects, org projects, or public shared
CREATE POLICY "Users can view accessible projects" ON projects
  FOR SELECT USING (
    deleted_at IS NULL 
    AND (
      -- Personal projects (no org)
      (user_id = auth.jwt()->>'sub' AND clerk_org_id IS NULL)
      OR
      -- Organization projects (check if user's org_id matches)
      (
        clerk_org_id IS NOT NULL
        AND clerk_org_id = auth.jwt()->>'org_id'
      )
      OR
      -- Public shared projects
      (is_public = TRUE AND share_token IS NOT NULL)
    )
  );

-- INSERT: Users can create personal or org projects
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (
    auth.jwt() IS NOT NULL
    AND (
      -- Personal project
      (user_id = auth.jwt()->>'sub' AND clerk_org_id IS NULL)
      OR
      -- Organization project (user must be in that org)
      (
        clerk_org_id IS NOT NULL
        AND clerk_org_id = auth.jwt()->>'org_id'
      )
    )
  );

-- UPDATE: Users can update their accessible projects
CREATE POLICY "Users can update accessible projects" ON projects
  FOR UPDATE USING (
    deleted_at IS NULL 
    AND (
      -- Personal project
      (user_id = auth.jwt()->>'sub' AND clerk_org_id IS NULL)
      OR
      -- Organization project
      (
        clerk_org_id IS NOT NULL
        AND clerk_org_id = auth.jwt()->>'org_id'
      )
    )
  );

-- DELETE: Users can delete their accessible projects
CREATE POLICY "Users can delete accessible projects" ON projects
  FOR UPDATE USING (
    -- Personal project
    (user_id = auth.jwt()->>'sub' AND clerk_org_id IS NULL)
    OR
    -- Organization project (check org membership and role)
    (
      clerk_org_id IS NOT NULL
      AND clerk_org_id = auth.jwt()->>'org_id'
      AND (auth.jwt()->>'org_role' IN ('org:admin', 'org:owner'))
    )
  );

-- ========================================
-- STEP 5: Add comments
-- ========================================
COMMENT ON COLUMN projects.user_id IS 'Clerk user ID for personal projects (NULL for org projects)';
COMMENT ON COLUMN projects.clerk_org_id IS 'Clerk organization ID (NULL for personal projects)';

-- ========================================
-- DONE! ✅
-- ========================================

SELECT 'Migration completed successfully! ✅' AS status;

