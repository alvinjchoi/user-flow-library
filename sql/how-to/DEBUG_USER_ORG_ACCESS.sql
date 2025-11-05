-- Debug User and Organization Access
-- Run these queries to understand your current access context

-- ============================================================================
-- STEP 1: Find Your Clerk User ID
-- ============================================================================
-- Run this in your browser console while logged in to get your user ID:
-- 
-- console.log('Current User ID:', window.Clerk?.user?.id);
-- console.log('Current Org ID:', window.Clerk?.organization?.id);
--

-- ============================================================================
-- STEP 2: See all your personal projects
-- ============================================================================
-- Replace 'YOUR_CLERK_USER_ID' with the ID from Step 1
SELECT 
  id,
  name,
  created_at,
  deleted_at,
  'Personal' as type
FROM projects
WHERE user_id = 'YOUR_CLERK_USER_ID'  -- Replace this
  AND deleted_at IS NULL
ORDER BY created_at DESC;


-- ============================================================================
-- STEP 3: See all organization projects for a specific org
-- ============================================================================
-- Replace 'YOUR_CLERK_ORG_ID' with your organization ID
SELECT 
  id,
  name,
  clerk_org_id,
  created_at,
  deleted_at,
  'Organization' as type
FROM projects
WHERE clerk_org_id = 'YOUR_CLERK_ORG_ID'  -- Replace this
  AND deleted_at IS NULL
ORDER BY created_at DESC;


-- ============================================================================
-- STEP 4: See ALL projects (regardless of owner) - Diagnostic only
-- ============================================================================
-- This bypasses RLS - useful for debugging what projects exist
SELECT 
  id,
  name,
  CASE 
    WHEN clerk_org_id IS NOT NULL THEN 'Organization'
    WHEN user_id IS NOT NULL THEN 'Personal'
    ELSE 'Invalid'
  END as type,
  COALESCE(user_id, 'N/A') as user_id,
  COALESCE(clerk_org_id, 'N/A') as clerk_org_id,
  is_public,
  deleted_at IS NULL as is_active,
  created_at
FROM projects
WHERE deleted_at IS NULL
ORDER BY created_at DESC;


-- ============================================================================
-- STEP 5: Check specific project access requirements
-- ============================================================================
SELECT 
  id,
  name,
  CASE 
    WHEN clerk_org_id IS NOT NULL THEN 
      CONCAT('You need to be in organization: ', clerk_org_id)
    WHEN user_id IS NOT NULL THEN 
      CONCAT('You need to be user: ', user_id)
    ELSE 'Invalid project - no owner'
  END as access_requirement,
  CASE 
    WHEN is_public THEN 
      CONCAT('OR access via public link: https://www.userflowlibrary.com/share/', share_token)
    ELSE 'Not publicly shared'
  END as alternative_access
FROM projects
WHERE id = 'c0736d66-6c89-486f-8b4e-fd67a741380e';  -- Replace with your project ID


-- ============================================================================
-- STEP 6: JavaScript snippet to run in browser console
-- ============================================================================
-- Copy and paste this into your browser console while on the app:
/*

// Check your current authentication state
async function checkAuthState() {
  console.log('=== Authentication State ===');
  console.log('User ID:', window.Clerk?.user?.id);
  console.log('Organization ID:', window.Clerk?.organization?.id);
  console.log('Organization Name:', window.Clerk?.organization?.name);
  
  // Try to fetch the project
  const projectId = 'c0736d66-6c89-486f-8b4e-fd67a741380e';
  console.log('\n=== Attempting to fetch project ===');
  console.log('Project ID:', projectId);
  
  try {
    const response = await fetch(`/api/projects/${projectId}`);
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.status === 404) {
      console.error('❌ Project not found or no access');
      console.log('\n💡 Possible solutions:');
      console.log('1. Switch to the correct organization');
      console.log('2. Ask the project owner to share it with you');
      console.log('3. Use the public share link if available');
    } else if (response.status === 200) {
      console.log('✅ Project access granted!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAuthState();

*/


