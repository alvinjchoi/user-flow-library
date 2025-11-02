-- Check RLS policies on flows and screens tables
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  LEFT(qual::text, 100) as "policy_condition"
FROM pg_policies
WHERE tablename IN ('flows', 'screens')
ORDER BY tablename, policyname;

