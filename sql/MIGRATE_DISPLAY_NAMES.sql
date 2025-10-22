-- =====================================================
-- Display Name Migration Script
-- =====================================================
-- This script adds display_name column and migrates existing data
-- 
-- Purpose: Enable dual naming system
-- - title: Technical name for developers (e.g., "Search Screen")
-- - display_name: Action-oriented name for sidebar (e.g., "Searching Reddit")
-- =====================================================

-- Step 1: Add display_name column if it doesn't exist
ALTER TABLE screens 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Step 2: Check current data
SELECT 
  'Data Overview' as report,
  COUNT(*) as total_screens,
  COUNT(CASE WHEN display_name IS NOT NULL THEN 1 END) as with_display_name,
  COUNT(CASE WHEN display_name IS NULL THEN 1 END) as without_display_name
FROM screens;

-- Step 3: Inspect existing screen titles (first 20 rows)
SELECT 
  s.id,
  s.title,
  s.display_name,
  s.screenshot_url IS NOT NULL as has_screenshot,
  f.name as flow_name,
  p.name as project_name
FROM screens s
JOIN flows f ON s.flow_id = f.id
JOIN projects p ON f.project_id = p.id
ORDER BY p.name, f.name, s.order_index
LIMIT 20;

-- =====================================================
-- Migration Options
-- =====================================================

-- OPTION A: Copy title → display_name (preserve existing names)
-- Run this if you want to keep current names for both fields initially
/*
UPDATE screens 
SET display_name = title 
WHERE display_name IS NULL;
*/

-- OPTION B: Smart migration with action-oriented naming
-- This attempts to convert technical names to action-oriented ones
-- You can customize the mapping based on your naming patterns
/*
UPDATE screens 
SET display_name = CASE
  -- Convert "Screen" suffix to action form
  WHEN title ILIKE '%Screen' THEN 
    CASE
      WHEN title ILIKE 'Login%' THEN 'Signing in'
      WHEN title ILIKE 'Sign%up%' THEN 'Creating account'
      WHEN title ILIKE 'Register%' THEN 'Registering'
      WHEN title ILIKE 'Profile%' THEN 'User profile'
      WHEN title ILIKE 'Settings%' THEN 'User settings'
      WHEN title ILIKE 'Search%' THEN 'Searching'
      WHEN title ILIKE 'Filter%' THEN 'Filtering'
      WHEN title ILIKE 'Sort%' THEN 'Sorting'
      WHEN title ILIKE 'Edit%' THEN 'Editing'
      WHEN title ILIKE 'Create%' THEN 'Creating'
      WHEN title ILIKE 'Delete%' THEN 'Deleting'
      WHEN title ILIKE 'Upload%' THEN 'Uploading'
      WHEN title ILIKE 'Share%' THEN 'Sharing'
      WHEN title ILIKE 'Comment%' THEN 'Commenting'
      WHEN title ILIKE 'Chat%' THEN 'Chatting'
      WHEN title ILIKE 'Message%' THEN 'Messaging'
      WHEN title ILIKE 'Notification%' THEN 'Notifications'
      -- Remove " Screen" suffix for others
      ELSE REPLACE(title, ' Screen', '')
    END
  -- Keep existing display_name if set
  WHEN display_name IS NOT NULL THEN display_name
  -- Default: use title as-is
  ELSE title
END
WHERE display_name IS NULL;
*/

-- =====================================================
-- Verification Queries
-- =====================================================

-- View the results after migration
SELECT 
  s.id,
  s.title as technical_name,
  s.display_name as sidebar_name,
  CASE 
    WHEN s.title = s.display_name THEN '⚠️ Same'
    ELSE '✅ Different'
  END as naming_status,
  f.name as flow_name
FROM screens s
JOIN flows f ON s.flow_id = f.id
ORDER BY f.name, s.order_index;

-- Count screens that need manual review
SELECT 
  COUNT(*) as needs_review
FROM screens 
WHERE display_name IS NULL 
   OR title = display_name;

-- =====================================================
-- Recommendations
-- =====================================================
-- After running this migration:
-- 1. Review the results using the verification queries above
-- 2. Manually update display_name for key screens to follow Mobbin style
-- 3. Future uploads with AI will auto-generate both title and display_name
-- 
-- Naming Guidelines:
-- - title: "Login Screen", "Profile Screen", "Search Screen"
-- - display_name: "Signing in", "User profile", "Searching Reddit"
-- =====================================================

