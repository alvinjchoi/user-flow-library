-- OPTIONAL: Add profiles and organizations tables for extended functionality
-- Only implement if you need:
-- - User-specific settings/preferences
-- - Organization-specific settings
-- - Complex queries involving user/org data
-- - Caching to reduce Clerk API calls

-- ===================================
-- 1. PROFILES TABLE (Optional)
-- ===================================
CREATE TABLE IF NOT EXISTS profiles (
  clerk_user_id TEXT PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  preferences JSONB DEFAULT '{}', -- User preferences (theme, notifications, etc.)
  metadata JSONB DEFAULT '{}', -- Additional user metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles (for mentions, collaboration, etc.)
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (TRUE);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.jwt()->>'sub' = clerk_user_id);

-- Allow webhook to insert profiles
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (TRUE); -- Requires service_role key

-- ===================================
-- 2. ORGANIZATIONS TABLE (Optional)
-- ===================================
CREATE TABLE IF NOT EXISTS organizations (
  clerk_org_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}', -- Org-specific settings (branding, limits, etc.)
  plan TEXT DEFAULT 'free', -- Subscription plan
  metadata JSONB DEFAULT '{}', -- Additional org metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- RLS Policies for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users can view organizations they belong to
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (auth.jwt()->>'org_id' = clerk_org_id);

-- Allow webhook to insert/update organizations
CREATE POLICY "Service role can manage organizations"
  ON organizations FOR ALL
  USING (TRUE); -- Requires service_role key

-- ===================================
-- 3. UPDATE PROJECTS TABLE (Optional)
-- ===================================
-- Add foreign key constraints if using organizations table
-- ALTER TABLE projects
-- ADD CONSTRAINT fk_projects_organization
-- FOREIGN KEY (clerk_org_id) REFERENCES organizations(clerk_org_id) ON DELETE CASCADE;

-- ===================================
-- 4. SYNC DATA VIA WEBHOOKS
-- ===================================
-- Update app/api/webhooks/clerk/route.ts to sync:
-- - user.created → INSERT into profiles
-- - user.updated → UPDATE profiles
-- - organization.created → INSERT into organizations
-- - organization.updated → UPDATE organizations

-- ===================================
-- USAGE EXAMPLES
-- ===================================

-- Get user profile with preferences
-- SELECT * FROM profiles WHERE clerk_user_id = 'user_xxxxx';

-- Get organization with settings
-- SELECT * FROM organizations WHERE clerk_org_id = 'org_xxxxx';

-- Get all projects for an org with org details
-- SELECT p.*, o.name as org_name, o.plan
-- FROM projects p
-- JOIN organizations o ON p.clerk_org_id = o.clerk_org_id
-- WHERE o.clerk_org_id = 'org_xxxxx';

-- ===================================
-- BENEFITS
-- ===================================
-- ✅ Store user preferences (theme, notifications, etc.)
-- ✅ Store org settings (branding, limits, billing info)
-- ✅ Faster queries (no need to call Clerk API)
-- ✅ Complex JOINs and analytics
-- ✅ Better caching

-- ===================================
-- WHEN NOT NEEDED
-- ===================================
-- ❌ Simple apps with basic auth
-- ❌ All user data managed by Clerk
-- ❌ No org-specific settings needed
-- ❌ RLS already works with JWT claims

COMMENT ON TABLE profiles IS 'Optional: User profiles with preferences and metadata';
COMMENT ON TABLE organizations IS 'Optional: Organization data with settings and metadata';

