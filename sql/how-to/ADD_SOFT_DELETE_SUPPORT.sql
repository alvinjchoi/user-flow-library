-- =====================================================
-- Add Soft Delete Support
-- =====================================================
-- Adds deleted_at columns to projects, flows, and screens tables
-- for implementing soft-delete functionality
-- =====================================================

-- Add deleted_at column to projects table
ALTER TABLE projects 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to flows table  
ALTER TABLE flows 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to screens table
ALTER TABLE screens 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create indexes for better performance on soft-delete queries
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX idx_flows_deleted_at ON flows(deleted_at);
CREATE INDEX idx_screens_deleted_at ON screens(deleted_at);

-- Update RLS policies to exclude soft-deleted records
-- Projects
DROP POLICY IF EXISTS "Users can view projects" ON projects;
CREATE POLICY "Users can view projects" ON projects
  FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can create projects" ON projects;
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update projects" ON projects;
CREATE POLICY "Users can update projects" ON projects
  FOR UPDATE USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can delete projects" ON projects;
CREATE POLICY "Users can delete projects" ON projects
  FOR UPDATE USING (deleted_at IS NULL);

-- Flows
DROP POLICY IF EXISTS "Users can view flows" ON flows;
CREATE POLICY "Users can view flows" ON flows
  FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can create flows" ON flows;
CREATE POLICY "Users can create flows" ON flows
  FOR INSERT WITH CHECK (deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update flows" ON flows;
CREATE POLICY "Users can update flows" ON flows
  FOR UPDATE USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can delete flows" ON flows;
CREATE POLICY "Users can delete flows" ON flows
  FOR UPDATE USING (deleted_at IS NULL);

-- Screens
DROP POLICY IF EXISTS "Users can view screens" ON screens;
CREATE POLICY "Users can view screens" ON screens
  FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can create screens" ON screens;
CREATE POLICY "Users can create screens" ON screens
  FOR INSERT WITH CHECK (deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update screens" ON screens;
CREATE POLICY "Users can update screens" ON screens
  FOR UPDATE USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can delete screens" ON screens;
CREATE POLICY "Users can delete screens" ON screens
  FOR UPDATE USING (deleted_at IS NULL);

-- =====================================================
-- Verify Setup
-- =====================================================
SELECT 
  'soft_delete_columns_added' as status,
  'deleted_at columns added to projects, flows, and screens tables' as description;
