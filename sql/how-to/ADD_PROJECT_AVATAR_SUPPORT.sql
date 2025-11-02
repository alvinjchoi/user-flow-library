-- =====================================================
-- Add Project Avatar Support
-- =====================================================
-- Adds avatar_url column to projects table for storing project avatars
-- =====================================================

-- Add avatar_url column to projects table
ALTER TABLE projects 
ADD COLUMN avatar_url TEXT DEFAULT NULL;

-- Create index for better performance on avatar queries
CREATE INDEX idx_projects_avatar_url ON projects(avatar_url);

-- =====================================================
-- Verify Setup
-- =====================================================
SELECT 
  'avatar_column_added' as status,
  'avatar_url column added to projects table' as description;
