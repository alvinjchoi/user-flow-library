# Debugging 404 Errors for Projects

## Current Status

✅ Project exists in database
✅ You're in the correct organization (`org_YOUR_ORG_ID_HERE`)
✅ Dashboard shows the project
❌ Project page returns 404

## Steps to Debug

### Step 1: Check Server Logs

I've added debug logging to the API route. Look at your terminal where the Next.js dev server is running and search for lines starting with:
```
[API /projects/[id]]
```

### Step 2: Test the API Endpoint Directly

Open your browser console (while logged in) and run:

```javascript
(async function() {
  const projectId = 'YOUR-PROJECT-ID-HERE';
  console.log('=== Testing Project API ===');
  
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', data);
    
    // Also check auth state
    console.log('\nAuth State:');
    console.log('User ID:', window.Clerk?.user?.id);
    console.log('Org ID:', window.Clerk?.organization?.id);
    console.log('Org Name:', window.Clerk?.organization?.name);
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

### Step 3: Clear Next.js Cache

Sometimes Next.js caching can cause issues. Try:

```bash
cd /Users/crave/GitHub/v0-pattern-library
rm -rf .next
pnpm dev
```

### Step 4: Check Browser Network Tab

1. Open Developer Tools (F12 or Cmd+Option+I)
2. Go to the Network tab
3. Try to access the project page
4. Look for the request to `/api/projects/YOUR-PROJECT-ID-HERE`
5. Click on it to see:
   - Request headers (especially cookies)
   - Response status and body
   - Any error messages

### Step 5: Verify Organization is Set

In your browser console:

```javascript
console.log('Current Context:', {
  userId: window.Clerk?.user?.id,
  orgId: window.Clerk?.organization?.id,
  orgName: window.Clerk?.organization?.name,
  isOrgActive: window.Clerk?.organization?.id === 'org_YOUR_ORG_ID_HERE'
});
```

## Common Issues & Fixes

### Issue 1: Organization Not Set in Context

**Symptom**: orgId is null or different in the API request

**Fix**: 
1. Go to dashboard
2. Click Organization Switcher (top left)
3. Make sure "Alvin's Personal Organization" is selected
4. Then try accessing the project again

### Issue 2: Stale Authentication

**Symptom**: 401 Unauthorized errors

**Fix**:
1. Sign out completely
2. Sign back in
3. Select the correct organization
4. Try again

### Issue 3: Route Not Found (Actual 404)

**Symptom**: Next.js says route doesn't exist

**Fix**:
```bash
# Restart the dev server
pkill -f "next dev"
cd /Users/crave/GitHub/v0-pattern-library
pnpm dev
```

### Issue 4: Clerk Session Not Synced

**Symptom**: Different orgId between dashboard and project page

**Fix**:
```javascript
// In browser console, force a session update
await window.Clerk?.session?.reload();
location.reload();
```

## What Should Happen

When working correctly, you should see in the server logs:
```
[API /projects/[id]] Request for project: YOUR-PROJECT-ID-HERE
[API /projects/[id]] Auth context: { 
  userId: 'user_YOUR_USER_ID_HERE', 
  orgId: 'org_YOUR_ORG_ID_HERE' 
}
[API /projects/[id]] Filtering by orgId: org_YOUR_ORG_ID_HERE
[API /projects/[id]] Query result: { data: 'YOUR-PROJECT-ID-HERE', error: undefined }
```

## Next Steps

1. Run Step 2 (Test API endpoint) in your browser console
2. Check the server logs (Step 1) for the debug output
3. Report back what you see in both places

The debug logs will tell us exactly where the request is failing!

