-- Script to assign existing projects to a specific organization
-- Replace 'YOUR_CLERK_ORG_ID' with your actual Clerk Organization ID

-- First, let's see which projects need to be assigned
SELECT id, name, user_id, clerk_org_id, created_at
FROM projects
WHERE clerk_org_id IS NULL AND deleted_at IS NULL
ORDER BY created_at DESC;

-- To update all unassigned projects to your organization, run:
-- UPDATE projects
-- SET clerk_org_id = 'YOUR_CLERK_ORG_ID', user_id = NULL
-- WHERE clerk_org_id IS NULL AND deleted_at IS NULL;

-- INSTRUCTIONS:
-- 1. Find your Clerk Organization ID:
--    - Click on the OrganizationSwitcher in the header
--    - Open browser DevTools (F12)
--    - Go to Console tab
--    - In the UserButton menu, click "Manage team" or inspect the OrganizationSwitcher
--    - Look for org_id in the Clerk JWT or run: JSON.parse(atob(document.cookie.split('__session=')[1].split('.')[1]))
--
-- 2. Replace 'YOUR_CLERK_ORG_ID' in the UPDATE statement above
--
-- 3. Run the UPDATE statement to assign all existing projects to your organization
--
-- EXAMPLE:
-- UPDATE projects
-- SET clerk_org_id = 'org_2abc123def456', user_id = NULL
-- WHERE clerk_org_id IS NULL AND deleted_at IS NULL;

COMMENT ON COLUMN projects.clerk_org_id IS 'Clerk Organization ID - run ASSIGN_PROJECTS_TO_ORG.sql to assign existing projects';

