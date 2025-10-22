-- =====================================================
-- User Flow Organizer Database Schema
-- =====================================================
-- This replaces the simple patterns table with a full
-- project/flow/screen hierarchy system
-- =====================================================

-- Drop existing patterns table if you want to start fresh
-- DROP TABLE IF EXISTS patterns CASCADE;

-- =====================================================
-- Projects Table
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- =====================================================
-- Flows Table (e.g., "Onboarding", "Checkout", etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  screen_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flows_project_id ON flows(project_id);
CREATE INDEX idx_flows_order ON flows(project_id, order_index);

-- =====================================================
-- Screens Table (hierarchical tree structure)
-- =====================================================
CREATE TABLE IF NOT EXISTS screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  
  -- Screen details
  title TEXT NOT NULL,
  screenshot_url TEXT,
  notes TEXT,
  
  -- Tree structure
  order_index INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  path TEXT, -- Full path like "Onboarding/Messages/Sending a message"
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_screens_flow_id ON screens(flow_id);
CREATE INDEX idx_screens_parent_id ON screens(parent_id);
CREATE INDEX idx_screens_path ON screens USING GIN(to_tsvector('english', path));
CREATE INDEX idx_screens_tags ON screens USING GIN(tags);

-- =====================================================
-- Enable Row Level Security
-- =====================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies (Public access for now)
-- =====================================================

-- Projects policies
DROP POLICY IF EXISTS "public_read_projects" ON projects;
CREATE POLICY "public_read_projects" ON projects
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "public_insert_projects" ON projects;
CREATE POLICY "public_insert_projects" ON projects
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_projects" ON projects;
CREATE POLICY "public_update_projects" ON projects
  FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "public_delete_projects" ON projects;
CREATE POLICY "public_delete_projects" ON projects
  FOR DELETE TO public USING (true);

-- Flows policies
DROP POLICY IF EXISTS "public_read_flows" ON flows;
CREATE POLICY "public_read_flows" ON flows
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "public_insert_flows" ON flows;
CREATE POLICY "public_insert_flows" ON flows
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_flows" ON flows;
CREATE POLICY "public_update_flows" ON flows
  FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "public_delete_flows" ON flows;
CREATE POLICY "public_delete_flows" ON flows
  FOR DELETE TO public USING (true);

-- Screens policies
DROP POLICY IF EXISTS "public_read_screens" ON screens;
CREATE POLICY "public_read_screens" ON screens
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "public_insert_screens" ON screens;
CREATE POLICY "public_insert_screens" ON screens
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_screens" ON screens;
CREATE POLICY "public_update_screens" ON screens
  FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "public_delete_screens" ON screens;
CREATE POLICY "public_delete_screens" ON screens
  FOR DELETE TO public USING (true);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to update screen count on flows
CREATE OR REPLACE FUNCTION update_flow_screen_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE flows 
    SET screen_count = screen_count - 1,
        updated_at = NOW()
    WHERE id = OLD.flow_id;
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    UPDATE flows 
    SET screen_count = screen_count + 1,
        updated_at = NOW()
    WHERE id = NEW.flow_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update screen count
DROP TRIGGER IF EXISTS trigger_update_screen_count ON screens;
CREATE TRIGGER trigger_update_screen_count
AFTER INSERT OR DELETE ON screens
FOR EACH ROW EXECUTE FUNCTION update_flow_screen_count();

-- Function to auto-generate path
CREATE OR REPLACE FUNCTION generate_screen_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path := NEW.title;
    NEW.level := 0;
  ELSE
    SELECT path, level INTO parent_path, NEW.level
    FROM screens WHERE id = NEW.parent_id;
    NEW.path := parent_path || ' > ' || NEW.title;
    NEW.level := NEW.level + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate path
DROP TRIGGER IF EXISTS trigger_generate_path ON screens;
CREATE TRIGGER trigger_generate_path
BEFORE INSERT OR UPDATE ON screens
FOR EACH ROW EXECUTE FUNCTION generate_screen_path();

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================

-- Insert a sample project
INSERT INTO projects (id, name, description, color) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Discord Mobile App', 'Discord mobile app user flows', '#5865F2')
ON CONFLICT (id) DO NOTHING;

-- Insert sample flow
INSERT INTO flows (id, project_id, name, description, order_index)
VALUES 
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Onboarding', 'User onboarding flow', 1)
ON CONFLICT (id) DO NOTHING;

-- Insert sample screens
INSERT INTO screens (flow_id, title, screenshot_url, order_index, parent_id)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'Welcome Screen', '/placeholder.svg', 1, NULL),
  ('00000000-0000-0000-0000-000000000002', 'Phone Entry', '/placeholder.svg', 2, NULL),
  ('00000000-0000-0000-0000-000000000002', 'Verification', '/placeholder.svg', 3, NULL)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Verify Setup
-- =====================================================
SELECT 
  'projects' as table_name,
  COUNT(*) as row_count
FROM projects
UNION ALL
SELECT 
  'flows' as table_name,
  COUNT(*) as row_count
FROM flows
UNION ALL
SELECT 
  'screens' as table_name,
  COUNT(*) as row_count
FROM screens;

