-- =====================================================
-- CUSTOMIZED MIGRATION for Your 11 Screens
-- =====================================================
-- Run this to populate display_name for all 11 screens
-- =====================================================

-- Step 1: Show current state (BEFORE)
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
WHERE s.display_name IS NULL
ORDER BY p.name, f.name, s.order_index;

-- Step 2: Apply Smart Conversion
UPDATE screens 
SET display_name = CASE
  -- Convert "Screen" suffix to action-oriented names
  WHEN title ILIKE '%Login%Screen%' OR title ILIKE 'Login%' THEN 'Signing in'
  WHEN title ILIKE '%Sign%up%Screen%' OR title ILIKE 'Sign%up%' THEN 'Creating account'
  WHEN title ILIKE '%Register%Screen%' OR title ILIKE 'Register%' THEN 'Registering'
  WHEN title ILIKE '%Onboard%Screen%' OR title ILIKE 'Onboard%' THEN 'Getting started'
  WHEN title ILIKE '%Welcome%Screen%' OR title ILIKE 'Welcome%' THEN 'Welcome'
  WHEN title ILIKE '%Profile%Screen%' OR title ILIKE '%Profile%' THEN 'User profile'
  WHEN title ILIKE '%Settings%Screen%' OR title ILIKE '%Settings%' THEN 'Settings'
  WHEN title ILIKE '%Search%Screen%' OR title ILIKE 'Search%' THEN 'Searching'
  WHEN title ILIKE '%Filter%Screen%' OR title ILIKE 'Filter%' THEN 'Filtering'
  WHEN title ILIKE '%Sort%Screen%' OR title ILIKE 'Sort%' THEN 'Sorting posts'
  WHEN title ILIKE '%Edit%Screen%' OR title ILIKE 'Edit%' THEN 'Editing'
  WHEN title ILIKE '%Create%Screen%' OR title ILIKE 'Create%' THEN 'Creating'
  WHEN title ILIKE '%Delete%Screen%' OR title ILIKE 'Delete%' THEN 'Deleting'
  WHEN title ILIKE '%Upload%Screen%' OR title ILIKE 'Upload%' THEN 'Uploading'
  WHEN title ILIKE '%Share%Screen%' OR title ILIKE 'Share%' THEN 'Sharing'
  WHEN title ILIKE '%Post%Screen%' OR title ILIKE 'Post%detail%' THEN 'Post detail'
  WHEN title ILIKE '%Comment%Screen%' OR title ILIKE '%Comment%' THEN 'Adding a comment'
  WHEN title ILIKE '%Chat%Screen%' OR title ILIKE 'Chat%' THEN 'Chat'
  WHEN title ILIKE '%Message%Screen%' OR title ILIKE '%Message%' THEN 'Messaging'
  WHEN title ILIKE '%Notification%Screen%' OR title ILIKE '%Notification%' THEN 'Notifications'
  WHEN title ILIKE '%Home%Screen%' OR title ILIKE 'Home%' THEN 'Home'
  WHEN title ILIKE '%Feed%Screen%' OR title ILIKE 'Feed%' THEN 'Feed'
  WHEN title ILIKE '%Inbox%Screen%' OR title ILIKE 'Inbox%' THEN 'Inbox'
  
  -- Remove generic " Screen" suffix if no specific match
  WHEN title ILIKE '%Screen' THEN TRIM(REPLACE(title, 'Screen', ''))
  WHEN title ILIKE '% Screen' THEN TRIM(REPLACE(title, ' Screen', ''))
  
  -- For screens without "Screen" suffix, keep title as-is
  ELSE title
END
WHERE display_name IS NULL;

-- Step 3: Show results (AFTER)
SELECT 
  s.id,
  s.title as technical_name,
  s.display_name as sidebar_name,
  CASE 
    WHEN s.title = s.display_name THEN '⚠️ Same (review needed)'
    ELSE '✅ Different'
  END as naming_status,
  f.name as flow_name,
  p.name as project_name
FROM screens s
JOIN flows f ON s.flow_id = f.id
JOIN projects p ON f.project_id = p.id
ORDER BY p.name, f.name, s.order_index;

-- Step 4: Find screens that still need manual review
SELECT 
  s.id,
  s.title,
  s.display_name,
  '👉 Consider making this more action-oriented' as suggestion,
  f.name as flow_name
FROM screens s
JOIN flows f ON s.flow_id = f.id
WHERE s.title = s.display_name
   OR s.display_name ILIKE '%Screen%'
ORDER BY f.name, s.order_index;

-- Step 5: Summary
SELECT 
  COUNT(*) as total_screens,
  COUNT(CASE WHEN display_name IS NOT NULL THEN 1 END) as with_display_name,
  COUNT(CASE WHEN display_name IS NULL THEN 1 END) as still_missing,
  COUNT(CASE WHEN title != display_name THEN 1 END) as properly_differentiated
FROM screens;

