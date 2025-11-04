-- Convert Organization Project to Personal Project
-- Use this when you need to convert an org-owned project to be owned by a specific user

-- IMPORTANT: Replace these values before running:
-- - Replace 'c0736d66-6c89-486f-8b4e-fd67a741380e' with your project ID
-- - Replace 'YOUR_CLERK_USER_ID' with your actual Clerk user ID

-- Step 1: Verify current ownership
SELECT 
  id,
  name,
  user_id,
  clerk_org_id,
  CASE 
    WHEN clerk_org_id IS NOT NULL THEN 'Organization Project'
    WHEN user_id IS NOT NULL THEN 'Personal Project'
    ELSE 'No Owner'
  END as current_type
FROM projects
WHERE id = 'c0736d66-6c89-486f-8b4e-fd67a741380e';

-- Step 2: Convert to personal project
UPDATE projects
SET 
  user_id = 'YOUR_CLERK_USER_ID',  -- Replace with your actual Clerk user ID
  clerk_org_id = NULL
WHERE id = 'c0736d66-6c89-486f-8b4e-fd67a741380e';

-- Step 3: Verify the change
SELECT 
  id,
  name,
  user_id,
  clerk_org_id,
  CASE 
    WHEN clerk_org_id IS NOT NULL THEN 'Organization Project'
    WHEN user_id IS NOT NULL THEN 'Personal Project'
    ELSE 'No Owner'
  END as new_type
FROM projects
WHERE id = 'c0736d66-6c89-486f-8b4e-fd67a741380e';

-- Note: After this change, only the specified user will be able to access the project
-- Organization members will lose access unless you share it publicly


