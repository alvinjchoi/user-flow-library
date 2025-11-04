# Fixed: Project 404 Issue

## Problem
Users were getting 404 errors when trying to access organization projects, even though they were logged in to the correct organization.

## Root Cause
The `getProject()` and `getProjects()` functions in `lib/projects.ts` were missing `credentials: "include"` in their fetch requests. This meant that **Clerk authentication cookies were not being sent** to the API routes, causing the server to see the user as unauthenticated (`userId: null, orgId: null`).

## What Was Happening
1. User navigates to `/projects/[id]`
2. Client-side component loads and Clerk auth initializes
3. Component calls `getProject(id)` 
4. **Fetch request doesn't include cookies** ❌
5. Server-side API route receives request with no auth
6. API returns 404/401
7. Page shows "Project not found"

## The Fix
Modified `lib/projects.ts` to:

1. **Add `credentials: "include"`** to all fetch requests
   - Ensures Clerk session cookies are sent with every API call
   
2. **Add retry logic to `getProject()`**
   - If the API returns 401 (Unauthorized), wait 1 second and retry once
   - This handles edge cases where Clerk cookies load slightly after the component

## Files Modified
- `lib/projects.ts` - Added credentials and retry logic

## Testing
After the fix:
- ✅ Organization projects load correctly
- ✅ Personal projects still work
- ✅ No more phantom 404 errors
- ✅ Graceful handling of auth timing issues

## Related Issues
This also fixed the initial 404 error for resource `eba8dfe2-692d-469a-b9a9-f4a26789662c`, which was an avatar URL. We added client-side error handling for broken avatar URLs in:
- `app/dashboard/page.tsx`
- `components/header.tsx`
- `app/share/[token]/page.tsx`

These components now gracefully fall back to color blocks or icons when avatars fail to load.


