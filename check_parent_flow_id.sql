-- Check if parent_flow_id column exists in flows table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'flows'
ORDER BY ordinal_position;
