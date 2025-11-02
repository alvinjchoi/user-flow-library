# 🔐 Critical Security Update - User Access Control

## ⚠️ Current Security Issue

**CRITICAL**: Your application currently allows ALL users to see and modify ALL projects. There is no user ownership or access control.

## ✅ What We've Fixed

1. **Added `user_id` column** to projects table
2. **Updated TypeScript types** to include user_id
3. **Updated RLS policies** to filter projects by owner
4. **Modified createProject()** to require userId parameter
5. **Updated HomePage** to pass current user ID when creating projects

## 📋 Required Actions

### 1️⃣ Run the Database Migration

**IMPORTANT**: You need to run this SQL script on your Supabase database:

```bash
sql/ADD_USER_OWNERSHIP_TO_PROJECTS.sql
```

Go to: **Supabase Dashboard → SQL Editor → New Query** and paste the contents of this file.

### 2️⃣ Update Existing Projects

After running the migration, you need to assign ownership to existing projects. Run this in Supabase SQL Editor:

```sql
-- List all projects and their current user_id (will show 'migration' for all)
SELECT id, name, user_id FROM projects;

-- Update projects to belong to a specific user
-- Replace 'YOUR_CLERK_USER_ID' with the actual Clerk user ID
UPDATE projects 
SET user_id = 'YOUR_CLERK_USER_ID' 
WHERE user_id = 'migration';
```

To find your Clerk user ID:
1. Sign in to your app
2. Open browser console
3. Run: `await fetch('/api/debug-user')` (or check Clerk Dashboard)

### 3️⃣ Remove the Default Constraint

After updating all projects, remove the temporary default:

```sql
ALTER TABLE projects ALTER COLUMN user_id DROP DEFAULT;
```

### 4️⃣ Configure Clerk + Supabase Integration

For RLS to work properly with Clerk authentication, you need to:

1. **In Clerk Dashboard**:
   - Go to **JWT Templates**
   - Create a new template called `supabase`
   - Use this configuration:
     ```json
     {
       "aud": "authenticated",
       "exp": "{{jwt.expires_at}}",
       "sub": "{{user.id}}",
       "role": "authenticated"
     }
     ```

2. **In Supabase Dashboard**:
   - Go to **Authentication → Providers → Custom (JWT)**
   - Get your Clerk JWKS URL from Clerk Dashboard
   - Add it to Supabase

## 🔒 What's Protected Now

### ✅ Projects
- Users can only see their own projects
- Users can only create projects for themselves
- Users can only update/delete their own projects
- Public shared projects (with share_token) are visible to everyone

### ❌ Still Need Protection

You should also review and secure:

1. **Flows** - Add user/project ownership check
2. **Screens** - Add user/project ownership check
3. **API Routes** - Ensure all routes verify ownership

## 🧪 Testing

After implementing, test these scenarios:

1. ✅ Create a new project → Should only be visible to you
2. ✅ Try to access another user's project → Should get 403/404
3. ✅ Share a project → Others should see it read-only
4. ✅ Try to modify another user's project → Should fail

## 🚨 Additional Security Recommendations

### 1. Protect API Routes

Update API routes in `app/api/projects/[id]/share/route.ts` to verify ownership:

```typescript
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  
  // RLS will automatically filter by user_id
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Rest of your logic...
}
```

### 2. Add RLS to Flows and Screens

Flows and screens should also check project ownership:

```sql
-- Flows RLS
CREATE POLICY "Users can view flows from their projects" ON flows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = flows.project_id
      AND (
        p.user_id = auth.jwt()->>'sub'
        OR (p.is_public = TRUE AND p.share_token IS NOT NULL)
      )
    )
  );

-- Similar policies for INSERT, UPDATE, DELETE
```

### 3. Audit All Data Access

Search your codebase for:
- Direct Supabase queries without user filtering
- API routes without auth checks
- Client-side data fetching without RLS

## 📚 Learn More

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Clerk + Supabase Integration](https://clerk.com/docs/integrations/databases/supabase)
- [Next.js Security Best Practices](https://nextjs.org/docs/pages/building-your-application/authentication)

## ❓ Questions?

If you encounter any issues:
1. Check Supabase logs for RLS policy violations
2. Verify Clerk JWT template is configured correctly
3. Ensure environment variables are set properly
4. Test with multiple user accounts

