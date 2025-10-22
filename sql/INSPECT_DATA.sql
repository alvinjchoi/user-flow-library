-- =====================================================
-- Data Inspection Script
-- =====================================================
-- Run this first to understand your current data structure
-- =====================================================

-- Check if tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('projects', 'flows', 'screens')
ORDER BY 
  CASE table_name
    WHEN 'projects' THEN 1
    WHEN 'flows' THEN 2
    WHEN 'screens' THEN 3
  END;

-- Check screens table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'screens'
ORDER BY ordinal_position;

-- Count records in each table
SELECT 
  'projects' as table_name,
  COUNT(*) as record_count
FROM projects
UNION ALL
SELECT 
  'flows' as table_name,
  COUNT(*) as record_count
FROM flows
UNION ALL
SELECT 
  'screens' as table_name,
  COUNT(*) as record_count
FROM screens;

-- Show project → flow → screen hierarchy
SELECT 
  p.name as project_name,
  f.name as flow_name,
  COUNT(s.id) as screen_count
FROM projects p
LEFT JOIN flows f ON f.project_id = p.id
LEFT JOIN screens s ON s.flow_id = f.id
GROUP BY p.id, p.name, f.id, f.name
ORDER BY p.name, f.name;

-- Show all screens with their relationships
SELECT 
  p.name as project,
  f.name as flow,
  s.title,
  s.display_name,
  s.parent_id IS NOT NULL as has_parent,
  s.screenshot_url IS NOT NULL as has_screenshot,
  s.notes IS NOT NULL as has_notes,
  s.order_index,
  s.created_at
FROM screens s
JOIN flows f ON s.flow_id = f.id
JOIN projects p ON f.project_id = p.id
ORDER BY p.name, f.name, s.order_index;

-- Check for screens with naming issues
SELECT 
  'Missing display_name' as issue,
  COUNT(*) as count
FROM screens 
WHERE display_name IS NULL
UNION ALL
SELECT 
  'display_name same as title' as issue,
  COUNT(*) as count
FROM screens 
WHERE display_name = title
UNION ALL
SELECT 
  'Has generic "Screen" suffix' as issue,
  COUNT(*) as count
FROM screens 
WHERE title ILIKE '%Screen%';

