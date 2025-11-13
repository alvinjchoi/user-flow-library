-- =====================================================
-- Update Platform Types for Specific Projects
-- =====================================================
-- Manually set the correct platform type for each project
-- =====================================================

-- First, let's see all current projects
SELECT 
  id,
  name,
  platform_type,
  created_at
FROM projects
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- Update specific project to iOS
UPDATE projects
SET platform_type = 'ios'
WHERE id = 'YOUR-PROJECT-ID-HERE'  -- Replace with actual project ID
  AND deleted_at IS NULL;

-- Add more updates here for other projects as needed:
-- UPDATE projects SET platform_type = 'ios' WHERE id = 'project-id-here';
-- UPDATE projects SET platform_type = 'android' WHERE id = 'project-id-here';

-- Verify the updates
SELECT 
  id,
  name,
  platform_type,
  created_at
FROM projects
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- Summary by platform type
SELECT 
  platform_type,
  COUNT(*) as project_count
FROM projects
WHERE deleted_at IS NULL
GROUP BY platform_type
ORDER BY platform_type;

