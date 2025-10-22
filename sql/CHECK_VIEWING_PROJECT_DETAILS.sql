-- Check the "Viewing project details" screen data
-- Run this in your Supabase SQL editor to see what's wrong

-- Find all screens with "Viewing project details" in the title or display_name
SELECT 
  id,
  flow_id,
  parent_id,
  title,
  display_name,
  level,
  order_index,
  path,
  screenshot_url,
  created_at
FROM screens
WHERE 
  title ILIKE '%viewing%project%details%' 
  OR display_name ILIKE '%viewing%project%details%';

-- Also check the parent screen (Browsing projects)
SELECT 
  id,
  flow_id,
  parent_id,
  title,
  display_name,
  level,
  order_index,
  path,
  screenshot_url,
  created_at
FROM screens
WHERE 
  title ILIKE '%browsing%projects%' 
  OR display_name ILIKE '%browsing%projects%';

-- Check the Projects flow
SELECT 
  id,
  project_id,
  name,
  parent_screen_id,
  screen_count,
  order_index
FROM flows
WHERE name ILIKE '%projects%';

-- Fix the level and parent_id for "Viewing project details" if needed
-- Uncomment and run these if the data is wrong:

/*
-- First, find the parent screen ID (Browsing projects)
WITH parent_screen AS (
  SELECT id 
  FROM screens 
  WHERE title ILIKE '%browsing%projects%' 
    OR display_name ILIKE '%browsing%projects%'
  LIMIT 1
)
-- Then update the child screen (Viewing project details)
UPDATE screens
SET 
  parent_id = (SELECT id FROM parent_screen),
  level = 1,
  path = (SELECT path FROM screens WHERE id = (SELECT id FROM parent_screen)) || ' > Project Details Screen'
WHERE 
  (title ILIKE '%viewing%project%details%' OR display_name ILIKE '%viewing%project%details%')
  AND parent_id IS NULL; -- Only update if it doesn't have a parent yet
*/

