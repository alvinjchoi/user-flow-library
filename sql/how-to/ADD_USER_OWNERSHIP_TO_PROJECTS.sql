-- =====================================================
-- Add User Ownership to Projects
-- =====================================================
-- CRITICAL SECURITY UPDATE:
-- Adds user_id column to projects table and updates RLS policies
-- to ensure users can only access their own projects
-- =====================================================

-- Add user_id column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'migration';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Update RLS policies to enforce user ownership

-- DROP existing policies
DROP POLICY IF EXISTS "Users can view projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;

-- SELECT: Users can only view their own projects OR public shared projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (
    deleted_at IS NULL 
    AND (
      user_id = auth.jwt()->>'sub'
      OR (is_public = TRUE AND share_token IS NOT NULL)
    )
  );

-- INSERT: Users can create projects (user_id will be set automatically)
CREATE POLICY "Users can create their own projects" ON projects
  FOR INSERT WITH CHECK (
    user_id = auth.jwt()->>'sub'
  );

-- UPDATE: Users can only update their own projects
CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (
    deleted_at IS NULL 
    AND user_id = auth.jwt()->>'sub'
  );

-- DELETE: Users can only soft-delete their own projects
CREATE POLICY "Users can delete their own projects" ON projects
  FOR UPDATE USING (
    user_id = auth.jwt()->>'sub'
  );

-- Add comment to document the column
COMMENT ON COLUMN projects.user_id IS 'Clerk user ID of the project owner';

-- IMPORTANT: After running this migration, you need to:
-- 1. Update existing projects to have the correct user_id
-- 2. Remove the DEFAULT 'migration' constraint:
--    ALTER TABLE projects ALTER COLUMN user_id DROP DEFAULT;

