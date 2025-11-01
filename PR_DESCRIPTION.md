# feat: Multi-tenant support, Organizations, Security & UX improvements

## 🎯 Major Features

### 1. Clerk Organizations & Multi-tenant Support

- ✅ Full Clerk Organizations integration
- ✅ Auto-create default organization on user signup via webhook
- ✅ Organization switcher in dashboard
- ✅ User can belong to multiple organizations
- ✅ Project isolation by organization

### 2. User Ownership & Security

- ✅ Added `user_id` and `clerk_org_id` to projects table
- ✅ Row Level Security (RLS) policies enforcing ownership
- ✅ Server-side auth with API routes (`/api/projects`, `/api/projects/[id]`)
- ✅ Prevented cross-organization data access
- ✅ JWT template for Supabase RLS

### 3. Comment System Enhancements

- ✅ Comment resolution tracking (`resolved_at`, `resolved_by`)
- ✅ Figma-style collaborative resolution (anyone can resolve)
- ✅ Visual indicator for resolved comments

### 4. Drag & Drop Reordering

- ✅ Drag and drop screens to reorder within flows
- ✅ Visual feedback (cursor-move, opacity-50 when dragging)
- ✅ Horizontal gallery reordering
- ✅ Disabled in read-only mode

### 5. Branding & UI Improvements

- ✅ Rebranded from "User Flow Organizer" to "User Flow Library"
- ✅ Updated page titles and meta tags
- ✅ Inline WYSIWYG editing for project names (home + header)
- ✅ Cleaner header navigation (conditional rendering)
- ✅ Landing page separated from dashboard
- ✅ Removed setup warnings from production

## 🐛 Bug Fixes

### Authentication & Routing

- Fixed homepage redirect loop (removed global ClerkProvider redirects)
- Fixed organization route (converted to catch-all `[[...rest]]`)
- Fixed modal mode conflicts with dedicated sign-in/sign-up pages
- Fixed server-only import errors (moved auth to API routes)

### UI/UX

- Fixed empty state flashing while Clerk loads
- Fixed initial page auto-scroll (prevented unwanted scrollIntoView)
- Fixed project name editing causing navigation
- Fixed OrganizationSwitcher SVG width error

### Navigation

- Hide Dashboard link when already on dashboard
- Hide OrganizationSwitcher on project pages (cleaner UI)
- Back arrow now goes to /dashboard instead of /

## 📊 Database Changes

### New Columns

```sql
ALTER TABLE projects ADD COLUMN user_id TEXT;
ALTER TABLE projects ADD COLUMN clerk_org_id TEXT;
ALTER TABLE screen_comments ADD COLUMN resolved_at TIMESTAMPTZ;
ALTER TABLE screen_comments ADD COLUMN resolved_by TEXT;
```

### New RLS Policies

- Users can only view own/org projects
- Enforced ownership on create/update/delete
- Flexible comment resolution permissions

## 🔧 Technical Improvements

1. **Architecture:**

   - Client → lib/projects.ts → API Routes → auth() + Supabase
   - Proper client/server separation

2. **Performance:**

   - useRef for initial scroll prevention
   - Optimistic UI updates for reordering
   - AbortController for race condition prevention

3. **Security:**
   - Server-side auth validation
   - Protected API routes with middleware
   - RLS policies matching JWT claims

## 📝 Documentation

- Added `ENVIRONMENT_VARIABLES.md` with all required env vars
- Added `SECURITY_UPDATE_GUIDE.md` for migration
- Added `sql/COMBINED_SETUP.sql` for easier setup
- Updated README with new branding

## 🧪 Testing

Tested on:

- ✅ Local development (just-bison-76)
- ✅ Production (clerk.userflowlibrary.com)
- ✅ Multiple organizations
- ✅ Cross-org data isolation
- ✅ Public share links (read-only)

## 🚀 Deployment Notes

**Required Environment Variables:**

- `CLERK_SECRET_KEY` (updated for live instance)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (updated for live)
- `CLERK_WEBHOOK_SECRET` (for org auto-creation)
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Missing on Vercel Production**
- `OPENAI_API_KEY` (optional - for AI features only)

**Before Merge:**

1. ⚠️ Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel Production
2. Run `sql/COMBINED_SETUP.sql` on Production Supabase
3. Verify Clerk JWT template (`supabase`) is configured

**After Merge:**

1. Test organization switching
2. Verify project isolation
3. Check webhook org creation

## 📦 Commits Included

- **29 commits** since last merge
- Categories: Organizations (8), Security (5), UI/UX (8), Bug fixes (7), Docs (1)

---

**Ready to merge to `main` and deploy to production** (after adding SUPABASE_SERVICE_ROLE_KEY).
