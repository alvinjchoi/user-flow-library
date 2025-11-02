-- =============================================================================
-- FIX: Clean up corrupted user_id for Moiio project
-- =============================================================================

-- STEP 1: Check current state
SELECT 
  id,
  name,
  user_id,
  LENGTH(user_id) as "user_id_length",
  clerk_org_id,
  CASE 
    WHEN user_id LIKE '%\n%' THEN '❌ Has newline character'
    ELSE '✅ Clean'
  END as "user_id_status"
FROM projects
WHERE id = 'c0736d66-6c89-486f-8b4e-fd67a741380e';

-- STEP 2: Clean up the user_id (remove newline)
UPDATE projects
SET 
  user_id = TRIM(TRAILING E'\n' FROM user_id),
  updated_at = NOW()
WHERE id = 'c0736d66-6c89-486f-8b4e-fd67a741380e'
  AND user_id LIKE '%\n%';

-- STEP 3: Verify the fix
SELECT 
  id,
  name,
  user_id,
  LENGTH(user_id) as "user_id_length",
  clerk_org_id,
  CASE 
    WHEN user_id = 'user_34qyuKPHRbC48qS2teb7xiFpMDB' THEN '✅ Fixed!'
    ELSE '❌ Still has issues'
  END as "status"
FROM projects
WHERE id = 'c0736d66-6c89-486f-8b4e-fd67a741380e';

-- =============================================================================
-- NOTE: After fixing, you'll still need to switch to the correct organization
-- to access this project (org_34r7krkuYSEoZHT9xh0l2HAzH9o)
-- =============================================================================

