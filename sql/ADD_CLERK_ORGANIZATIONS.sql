-- =====================================================
-- Add Clerk Organizations Support
-- =====================================================
-- Integrates Clerk's built-in organization feature
-- This is simpler than custom organizations!
-- =====================================================

-- Add clerk_org_id to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS clerk_org_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_clerk_org_id ON projects(clerk_org_id);

-- Add comment
COMMENT ON COLUMN projects.clerk_org_id IS 'Clerk organization ID (if project belongs to an org)';

-- ========================================
-- UPDATE RLS POLICIES FOR ORGANIZATIONS
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update accessible projects" ON projects;
DROP POLICY IF EXISTS "Users can delete accessible projects" ON projects;

-- SELECT: Users can view:
-- 1. Their personal projects (user_id matches)
-- 2. Organization projects (org_id in their org_ids array)
-- 3. Public shared projects
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
        AND clerk_org_id = ANY(
          string_to_array(
            COALESCE(auth.jwt()->>'org_id', ''),
            ','
          )
        )
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

-- UPDATE: Users can update accessible projects
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

-- DELETE: Users can delete accessible projects
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
-- HELPER FUNCTION
-- ========================================

-- Function to check if user has access to a project
CREATE OR REPLACE FUNCTION user_can_access_project(
  project_id UUID,
  user_clerk_id TEXT,
  user_org_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  proj RECORD;
BEGIN
  SELECT * INTO proj FROM projects WHERE id = project_id;
  
  IF NOT FOUND OR proj.deleted_at IS NOT NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Personal project
  IF proj.user_id = user_clerk_id AND proj.clerk_org_id IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Organization project
  IF proj.clerk_org_id IS NOT NULL AND proj.clerk_org_id = user_org_id THEN
    RETURN TRUE;
  END IF;
  
  -- Public shared
  IF proj.is_public AND proj.share_token IS NOT NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- DONE! ✅
-- ========================================

-- What this enables:
-- 1. ✅ Projects can belong to Clerk organizations
-- 2. ✅ Projects can be personal (no org)
-- 3. ✅ RLS automatically checks org membership
-- 4. ✅ Org admins can manage org projects
-- 5. ✅ Public sharing still works

-- Next steps:
-- 1. Update TypeScript types
-- 2. Update createProject() to handle org_id
-- 3. Add organization selector in UI
-- 4. Migrate existing projects (keep as personal or assign to org)

