-- =====================================================
-- Add Platform Type to Projects
-- =====================================================
-- This migration adds a platform_type column to track
-- whether a project is for Web, iOS, or Android.
-- This helps determine the appropriate screen dimensions.
-- =====================================================

-- Add platform_type column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS platform_type TEXT CHECK (platform_type IN ('web', 'ios', 'android')) DEFAULT 'web';

-- Add comment to document the column
COMMENT ON COLUMN projects.platform_type IS 'Platform type for the project: web, ios, or android. Determines screen dimensions.';

-- Create index for filtering by platform type
CREATE INDEX IF NOT EXISTS idx_projects_platform_type ON projects(platform_type);

-- Verify the change
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'platform_type';

