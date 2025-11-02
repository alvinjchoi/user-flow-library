-- =====================================================
-- Add Organizations and Team Collaboration (Figma-style)
-- =====================================================
-- Creates a multi-level permission system:
-- 1. Organizations (teams/companies)
-- 2. Organization members with roles
-- 3. Projects belong to organizations
-- 4. Optional project-specific permissions
-- =====================================================

-- ========================================
-- 1. ORGANIZATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  avatar_url TEXT,
  owner_id TEXT NOT NULL, -- Clerk user ID of the owner
  
  -- Subscription/Plan info (optional for future)
  plan_type TEXT DEFAULT 'free', -- free, pro, enterprise
  max_projects INT DEFAULT 3,
  max_members INT DEFAULT 5,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_organizations_slug ON organizations(slug);

COMMENT ON TABLE organizations IS 'Teams or companies that own projects';
COMMENT ON COLUMN organizations.owner_id IS 'Clerk user ID of the organization owner';


-- ========================================
-- 2. ORGANIZATION MEMBERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Clerk user ID
  
  -- Cached user info for display
  user_email TEXT,
  user_name TEXT,
  user_avatar TEXT,
  
  -- Role-based access control (Figma-style)
  role TEXT NOT NULL DEFAULT 'member',
  -- Roles:
  --   'owner'  : Full control, can delete org, manage billing
  --   'admin'  : Can manage members, create/delete projects
  --   'member' : Can view and edit projects they have access to
  --   'viewer' : Read-only access to projects
  
  -- Invitation status
  status TEXT DEFAULT 'active', -- pending, active, suspended
  invited_by TEXT, -- Clerk user ID
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(role);

COMMENT ON TABLE organization_members IS 'Users who belong to an organization with their roles';
COMMENT ON COLUMN organization_members.role IS 'owner | admin | member | viewer';
COMMENT ON COLUMN organization_members.status IS 'pending | active | suspended';


-- ========================================
-- 3. UPDATE PROJECTS TABLE
-- ========================================
-- Add organization_id to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);

-- Make user_id nullable (since projects now belong to orgs, not individual users)
-- But keep it for backward compatibility and personal projects
ALTER TABLE projects ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN projects.organization_id IS 'Organization that owns this project (NULL for personal projects)';
COMMENT ON COLUMN projects.user_id IS 'User ID for personal projects (NULL for org projects)';


-- ========================================
-- 4. PROJECT MEMBERS TABLE (Optional granular access)
-- ========================================
-- For project-specific permissions within an organization
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Clerk user ID
  
  -- Project-level permission
  role TEXT NOT NULL DEFAULT 'editor',
  -- Roles:
  --   'admin'  : Can manage project settings, invite members
  --   'editor' : Can edit flows, screens, comments
  --   'viewer' : Read-only access
  
  -- Cached user info
  user_email TEXT,
  user_name TEXT,
  user_avatar TEXT,
  
  invited_by TEXT, -- Clerk user ID
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);

COMMENT ON TABLE project_members IS 'Project-specific access for fine-grained permissions';
COMMENT ON COLUMN project_members.role IS 'admin | editor | viewer';


-- ========================================
-- 5. INVITATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by TEXT NOT NULL, -- Clerk user ID
  role TEXT NOT NULL DEFAULT 'member',
  
  token TEXT UNIQUE NOT NULL, -- Secure invitation token
  status TEXT DEFAULT 'pending', -- pending, accepted, expired, cancelled
  
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_org_id ON invitations(organization_id);
CREATE INDEX idx_invitations_status ON invitations(status);

COMMENT ON TABLE invitations IS 'Pending invitations to organizations';


-- ========================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;


-- ========================================
-- ORGANIZATIONS POLICIES
-- ========================================

-- Users can view organizations they are members of
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.jwt()->>'sub' 
      AND status = 'active'
    )
  );

-- Only authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT WITH CHECK (
    auth.jwt() IS NOT NULL
    AND owner_id = auth.jwt()->>'sub'
  );

-- Only owners can update organization
CREATE POLICY "Owners can update their organizations" ON organizations
  FOR UPDATE USING (
    owner_id = auth.jwt()->>'sub'
    OR
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.jwt()->>'sub' 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- Only owners can delete organizations
CREATE POLICY "Owners can delete their organizations" ON organizations
  FOR DELETE USING (
    owner_id = auth.jwt()->>'sub'
  );


-- ========================================
-- ORGANIZATION MEMBERS POLICIES
-- ========================================

-- Members can view other members in their organization
CREATE POLICY "Users can view members in their organizations" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.jwt()->>'sub'
      AND status = 'active'
    )
  );

-- Only owners/admins can add members
CREATE POLICY "Admins can add members" ON organization_members
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.jwt()->>'sub' 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- Only owners/admins can update members
CREATE POLICY "Admins can update members" ON organization_members
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.jwt()->>'sub' 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- Only owners/admins can remove members
CREATE POLICY "Admins can remove members" ON organization_members
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.jwt()->>'sub' 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );


-- ========================================
-- UPDATED PROJECTS POLICIES
-- ========================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Users can view:
-- 1. Their personal projects (user_id matches)
-- 2. Organization projects where they are members
-- 3. Public shared projects
CREATE POLICY "Users can view accessible projects" ON projects
  FOR SELECT USING (
    deleted_at IS NULL 
    AND (
      -- Personal projects
      user_id = auth.jwt()->>'sub'
      OR
      -- Organization projects (user is org member)
      (
        organization_id IS NOT NULL
        AND organization_id IN (
          SELECT organization_id 
          FROM organization_members 
          WHERE user_id = auth.jwt()->>'sub'
          AND status = 'active'
        )
      )
      OR
      -- Public shared projects
      (is_public = TRUE AND share_token IS NOT NULL)
    )
  );

-- Users can create:
-- 1. Personal projects (their own)
-- 2. Organization projects (if they're admin/member)
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (
    -- Personal project
    (user_id = auth.jwt()->>'sub' AND organization_id IS NULL)
    OR
    -- Organization project
    (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.jwt()->>'sub'
        AND role IN ('owner', 'admin', 'member')
        AND status = 'active'
      )
    )
  );

-- Users can update:
-- 1. Their own personal projects
-- 2. Organization projects where they're admin/member
CREATE POLICY "Users can update accessible projects" ON projects
  FOR UPDATE USING (
    deleted_at IS NULL 
    AND (
      -- Personal project
      user_id = auth.jwt()->>'sub'
      OR
      -- Organization project with proper role
      (
        organization_id IS NOT NULL
        AND organization_id IN (
          SELECT organization_id 
          FROM organization_members 
          WHERE user_id = auth.jwt()->>'sub'
          AND role IN ('owner', 'admin', 'member')
          AND status = 'active'
        )
      )
    )
  );

-- Users can delete:
-- 1. Their own personal projects
-- 2. Organization projects where they're owner/admin
CREATE POLICY "Users can delete accessible projects" ON projects
  FOR UPDATE USING (
    -- Personal project
    user_id = auth.jwt()->>'sub'
    OR
    -- Organization project with admin rights
    (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.jwt()->>'sub'
        AND role IN ('owner', 'admin')
        AND status = 'active'
      )
    )
  );


-- ========================================
-- PROJECT MEMBERS POLICIES
-- ========================================

-- Users can view project members if they have access to the project
CREATE POLICY "Users can view project members" ON project_members
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE
      -- Check project access via RLS
      deleted_at IS NULL 
      AND (
        user_id = auth.jwt()->>'sub'
        OR
        organization_id IN (
          SELECT organization_id 
          FROM organization_members 
          WHERE user_id = auth.jwt()->>'sub'
          AND status = 'active'
        )
      )
    )
  );

-- Only project admins or org admins can add project members
CREATE POLICY "Admins can add project members" ON project_members
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      LEFT JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE 
        p.user_id = auth.jwt()->>'sub' -- Personal project owner
        OR
        (om.user_id = auth.jwt()->>'sub' AND om.role IN ('owner', 'admin')) -- Org admin
    )
  );


-- ========================================
-- INVITATIONS POLICIES
-- ========================================

-- Users can view invitations for organizations they manage
CREATE POLICY "Admins can view invitations" ON invitations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.jwt()->>'sub' 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- Only admins can create invitations
CREATE POLICY "Admins can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.jwt()->>'sub' 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
    AND invited_by = auth.jwt()->>'sub'
  );

-- Admins can update invitations (e.g., cancel)
CREATE POLICY "Admins can update invitations" ON invitations
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.jwt()->>'sub' 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );


-- ========================================
-- 7. HELPER FUNCTIONS
-- ========================================

-- Function to check if user is org admin
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID, user_clerk_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = user_clerk_id
    AND role IN ('owner', 'admin')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has project access
CREATE OR REPLACE FUNCTION has_project_access(proj_id UUID, user_clerk_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  proj_record RECORD;
BEGIN
  SELECT * INTO proj_record FROM projects WHERE id = proj_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Personal project
  IF proj_record.user_id = user_clerk_id THEN
    RETURN TRUE;
  END IF;
  
  -- Organization project
  IF proj_record.organization_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = proj_record.organization_id
      AND user_id = user_clerk_id
      AND status = 'active'
    );
  END IF;
  
  -- Public shared
  IF proj_record.is_public AND proj_record.share_token IS NOT NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================================
-- 8. TRIGGERS
-- ========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at 
  BEFORE UPDATE ON organization_members 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_members_updated_at 
  BEFORE UPDATE ON project_members 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ========================================
-- 9. INITIAL DATA SETUP (Optional)
-- ========================================

-- When creating a new organization, automatically add the owner as a member
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    status,
    joined_at
  ) VALUES (
    NEW.id,
    NEW.owner_id,
    'owner',
    'active',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_organization_created 
  AFTER INSERT ON organizations 
  FOR EACH ROW EXECUTE FUNCTION add_owner_as_member();


-- ========================================
-- DONE! ✅
-- ========================================

-- Summary of what was created:
-- 1. ✅ organizations table
-- 2. ✅ organization_members table with role-based access
-- 3. ✅ project_members table for project-specific permissions
-- 4. ✅ invitations table for email invites
-- 5. ✅ Updated projects table with organization_id
-- 6. ✅ Comprehensive RLS policies for all tables
-- 7. ✅ Helper functions for permission checks
-- 8. ✅ Triggers for auto-updating timestamps and memberships

-- Next steps:
-- 1. Update TypeScript types in lib/database.types.ts
-- 2. Create API routes for:
--    - Creating organizations
--    - Inviting members
--    - Managing roles
-- 3. Build UI for organization/team management
-- 4. Migrate existing projects to organizations or keep as personal

