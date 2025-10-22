-- Find "Authorizing Google sign-in" flow or screen
-- Check if it's a flow
SELECT 
  'flow' as type,
  id,
  project_id,
  name,
  parent_screen_id,
  screen_count,
  order_index,
  description
FROM flows
WHERE name ILIKE '%authorizing%google%'
   OR name ILIKE '%google%sign%in%'

UNION ALL

-- Check if it's a screen
SELECT 
  'screen' as type,
  id,
  flow_id as project_id,
  title as name,
  parent_id as parent_screen_id,
  level as screen_count,
  order_index,
  display_name as description
FROM screens
WHERE title ILIKE '%authorizing%google%'
   OR display_name ILIKE '%authorizing%google%'
   OR title ILIKE '%google%sign%in%'
   OR display_name ILIKE '%google%sign%in%';

