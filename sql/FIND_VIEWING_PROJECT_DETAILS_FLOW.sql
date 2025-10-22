-- Check if "Viewing project details" is a separate flow
SELECT 
  id,
  project_id,
  name,
  parent_screen_id,
  screen_count,
  order_index,
  description
FROM flows
WHERE name ILIKE '%viewing%project%details%'
   OR name = 'Viewing project details';

