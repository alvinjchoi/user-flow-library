# Clerk JWT Integration with Supabase

This guide explains how to configure Supabase to accept Clerk JWTs, enabling client-side Supabase queries with proper authentication.

## 🎯 Why Do This?

**Current Setup (API Routes):**
- ✅ Secure: All queries go through API routes with `supabaseAdmin`
- ✅ Simple: No JWT configuration needed
- ❌ More API routes needed for every operation

**With Clerk JWT (Optional):**
- ✅ Direct client-side queries with proper auth
- ✅ Fewer API routes needed for simple reads
- ✅ RLS policies enforced automatically
- ❌ More complex setup

**Recommendation:** Stick with API routes (current setup) unless you need real-time subscriptions or want to reduce API route count.

---

## 📋 Step 1: Create Clerk JWT Template

### 1.1 Go to Clerk Dashboard

1. Navigate to: https://dashboard.clerk.com
2. Select your application
3. Go to **JWT Templates** (in left sidebar)
4. Click **"+ New template"**
5. Select **"Supabase"** as the template type

### 1.2 Configure the Template

**Template Name:** `supabase`

**Claims:**
```json
{
  "aud": "authenticated",
  "exp": {{user.session_expiration}},
  "sub": {{user.id}},
  "email": {{user.primary_email_address}},
  "role": "authenticated",
  "app_metadata": {
    "provider": "clerk"
  },
  "user_metadata": {
    "clerk_user_id": {{user.id}},
    "first_name": {{user.first_name}},
    "last_name": {{user.last_name}}
  },
  "org_id": {{user.organization_id}},
  "org_role": {{user.organization_role}}
}
```

**Important Notes:**
- `sub` must be set to `{{user.id}}` (this is the Clerk User ID)
- `org_id` and `org_role` are used by RLS policies
- `aud` must be `"authenticated"` for Supabase

### 1.3 Save and Note the Issuer

After saving, you'll see:
- **JWKS Endpoint URL**: `https://<your-clerk-domain>/.well-known/jwks.json`
- **Issuer**: `https://<your-clerk-domain>`

Copy these values - you'll need them for Supabase configuration.

---

## 📋 Step 2: Configure Supabase to Accept Clerk JWTs

### 2.1 Go to Supabase Dashboard

1. Navigate to: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Authentication**

### 2.2 Add Clerk as JWT Provider

Scroll down to **"JWT Secret"** section:

**Option A: Using JWKS (Recommended)**
```json
{
  "jwks": {
    "url": "https://<your-clerk-domain>/.well-known/jwks.json"
  }
}
```

**Option B: Using Secret (if JWKS doesn't work)**
1. Go to your Clerk JWT Template settings
2. Find the **"Signing Key"**
3. Copy the secret
4. Add to Supabase:
```json
{
  "secret": "<your-clerk-jwt-secret>"
}
```

**⚠️ Important:** The `aud` claim in Clerk must match Supabase's expected audience (`authenticated`).

### 2.3 Update JWT Settings (if needed)

In Supabase Dashboard → Settings → Authentication → JWT Settings:

- **JWT Secret**: Updated to accept Clerk's JWKS
- **JWT Expiry Limit**: Set to match Clerk's session duration (e.g., 604800 for 7 days)

---

## 📋 Step 3: Create Custom Supabase Client

### 3.1 Create Clerk-Authenticated Supabase Client

Create `lib/supabase-clerk.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import type { Database } from "./database.types";

/**
 * Custom hook to create a Supabase client with Clerk authentication
 * This client includes the Clerk JWT in all requests, enabling RLS
 */
export function useSupabaseClerk() {
  const { getToken } = useAuth();

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: async () => {
          const token = await getToken({ template: "supabase" });
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      },
    }
  );

  return supabase;
}
```

### 3.2 Update Components to Use Clerk-Authenticated Client

**Example - Using in a component:**

```typescript
"use client";

import { useSupabaseClerk } from "@/lib/supabase-clerk";
import { useEffect, useState } from "react";

export function MyComponent() {
  const supabase = useSupabaseClerk();
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      // This query now includes Clerk JWT - RLS policies enforced!
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("deleted_at", null);

      if (error) {
        console.error("Error:", error);
        return;
      }

      setData(data);
    }

    loadData();
  }, [supabase]);

  return <div>{/* Render data */}</div>;
}
```

---

## 📋 Step 4: Update RLS Policies to Use Clerk Claims

Your RLS policies should already be checking `auth.jwt()` for Clerk claims:

```sql
-- Example: Projects RLS policy
CREATE POLICY "select_projects_by_user_or_org"
ON projects
FOR SELECT
TO authenticated
USING (
  -- Match by user_id (from Clerk JWT sub claim)
  (auth.jwt() ->> 'sub')::text = user_id
  OR
  -- Match by clerk_org_id (from Clerk JWT org_id claim)
  (auth.jwt() -> 'org_id')::text = clerk_org_id
);
```

**Verify your policies have these patterns!**

---

## 📋 Step 5: Test the Integration

### 5.1 Test in Browser Console

1. Open your app in the browser
2. Sign in with Clerk
3. Open DevTools Console
4. Run:

```javascript
// Get Clerk token
const clerkToken = await window.Clerk.session.getToken({
  template: "supabase",
});
console.log("Clerk JWT:", clerkToken);

// Decode to verify claims
const payload = JSON.parse(atob(clerkToken.split(".")[1]));
console.log("JWT Payload:", payload);
// Should show: sub, org_id, org_role, etc.
```

### 5.2 Test Direct Supabase Query

```javascript
// Create Supabase client with Clerk token
const { createClient } = await import("@supabase/supabase-js");
const token = await window.Clerk.session.getToken({ template: "supabase" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  }
);

// Test query - should return your projects only
const { data, error } = await supabase
  .from("projects")
  .select("*")
  .eq("deleted_at", null);

console.log("Projects:", data);
console.log("Error:", error);
```

If you see your projects, it's working! ✅

---

## 🔧 Troubleshooting

### Issue: "JWT expired" or "Invalid JWT"

**Solution:**
1. Check JWT expiry in Clerk template matches Supabase settings
2. Verify the Issuer URL matches exactly
3. Clear browser cache and re-authenticate

### Issue: "Row-level security policy violated"

**Solution:**
1. Verify RLS policies are checking `auth.jwt()` claims
2. Check that JWT has `sub`, `org_id`, `org_role` claims
3. Verify `user_id` and `clerk_org_id` in database match JWT claims

### Issue: "Could not verify JWT: JWSError"

**Solution:**
1. Check JWKS URL is accessible: `curl https://<your-domain>/.well-known/jwks.json`
2. Verify Supabase has correct JWKS configuration
3. Try using the secret key directly instead of JWKS

### Issue: Queries return empty results

**Solution:**
1. Check that projects have correct `user_id` and `clerk_org_id`
2. Verify JWT claims match database values exactly
3. Test query in Supabase SQL editor with hardcoded values

---

## 📊 Comparison: API Routes vs Clerk JWT

| Feature | API Routes (Current) | Clerk JWT |
|---------|---------------------|-----------|
| **Setup Complexity** | ✅ Simple | ❌ Complex |
| **Security** | ✅ Very Secure | ✅ Secure |
| **Performance** | ⚠️ Extra hop | ✅ Direct |
| **Real-time** | ❌ No subscriptions | ✅ Subscriptions |
| **Maintenance** | ⚠️ More API routes | ✅ Fewer routes |
| **Debugging** | ✅ Server logs | ⚠️ Client-side |

**Recommendation:** 
- **Stay with API routes** if your app works fine currently
- **Switch to Clerk JWT** if you need real-time subscriptions or want to simplify

---

## 🎯 Next Steps

If you decide to use Clerk JWT:

1. **Update existing functions** in `lib/flows.ts` and `lib/projects.ts`
2. **Remove API routes** that are no longer needed
3. **Test thoroughly** in all scenarios (personal projects, org projects)
4. **Monitor for JWT expiry issues**

If staying with API routes (recommended):
- ✅ You're done! The current setup is secure and working
- Keep RLS policies as a safety net
- Continue using `supabaseAdmin` in API routes

