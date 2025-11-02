-- ============================================
-- Screen Hotspots Migration
-- ============================================
-- This migration adds interactive hotspot functionality to screens,
-- enabling AI-powered prototype mode similar to Figma.
--
-- Features:
-- - Bounding boxes for clickable elements
-- - Navigation links to other screens
-- - AI confidence scores
-- - Element type and metadata
-- ============================================

-- Create screen_hotspots table
CREATE TABLE IF NOT EXISTS screen_hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id UUID NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  
  -- Bounding box (percentage-based for responsive scaling)
  -- These values are 0-100 representing percentage of image dimensions
  x_position DECIMAL(5,2) NOT NULL CHECK (x_position >= 0 AND x_position <= 100),
  y_position DECIMAL(5,2) NOT NULL CHECK (y_position >= 0 AND y_position <= 100),
  width DECIMAL(5,2) NOT NULL CHECK (width >= 0 AND width <= 100),
  height DECIMAL(5,2) NOT NULL CHECK (height >= 0 AND height <= 100),
  
  -- Element metadata
  element_type TEXT CHECK (element_type IN ('button', 'link', 'card', 'tab', 'input', 'icon', 'other')),
  element_label TEXT, -- Button text, link text, etc.
  element_description TEXT, -- AI-generated or user-provided description
  
  -- Navigation link
  target_screen_id UUID REFERENCES screens(id) ON DELETE SET NULL,
  interaction_type TEXT DEFAULT 'navigate' CHECK (interaction_type IN ('navigate', 'overlay', 'replace', 'back')),
  
  -- AI metadata
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1), -- 0.00 to 1.00
  is_ai_generated BOOLEAN DEFAULT false,
  
  -- Order for displaying hotspots
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_hotspots_screen ON screen_hotspots(screen_id);
CREATE INDEX idx_hotspots_target ON screen_hotspots(target_screen_id);
CREATE INDEX idx_hotspots_order ON screen_hotspots(screen_id, order_index);

-- Add comment for documentation
COMMENT ON TABLE screen_hotspots IS 'Interactive hotspots for creating clickable prototypes. Each hotspot defines a clickable area on a screenshot that can navigate to another screen.';
COMMENT ON COLUMN screen_hotspots.x_position IS 'Horizontal position from left as percentage (0-100)';
COMMENT ON COLUMN screen_hotspots.y_position IS 'Vertical position from top as percentage (0-100)';
COMMENT ON COLUMN screen_hotspots.width IS 'Width as percentage of image width (0-100)';
COMMENT ON COLUMN screen_hotspots.height IS 'Height as percentage of image height (0-100)';
COMMENT ON COLUMN screen_hotspots.confidence_score IS 'AI confidence score for auto-detected elements (0.00-1.00)';

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE screen_hotspots ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view hotspots for screens they have access to
-- (either through project ownership or organization membership)
CREATE POLICY "Users can view hotspots for accessible screens"
  ON screen_hotspots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM screens s
      JOIN flows f ON s.flow_id = f.id
      JOIN projects p ON f.project_id = p.id
      WHERE s.id = screen_hotspots.screen_id
        AND (
          -- Personal project owned by user
          p.user_id = (auth.jwt() ->> 'sub')::text
          OR
          -- Organization project
          p.clerk_org_id = (auth.jwt() ->> 'org_id')::text
          OR
          -- Public shared project
          p.is_public = true
        )
    )
  );

-- Policy 2: Users can create hotspots for screens they own
CREATE POLICY "Users can create hotspots for their screens"
  ON screen_hotspots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM screens s
      JOIN flows f ON s.flow_id = f.id
      JOIN projects p ON f.project_id = p.id
      WHERE s.id = screen_hotspots.screen_id
        AND (
          -- Personal project owned by user
          p.user_id = (auth.jwt() ->> 'sub')::text
          OR
          -- Organization project
          p.clerk_org_id = (auth.jwt() ->> 'org_id')::text
        )
        AND p.deleted_at IS NULL
    )
  );

-- Policy 3: Users can update hotspots for screens they own
CREATE POLICY "Users can update hotspots for their screens"
  ON screen_hotspots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM screens s
      JOIN flows f ON s.flow_id = f.id
      JOIN projects p ON f.project_id = p.id
      WHERE s.id = screen_hotspots.screen_id
        AND (
          -- Personal project owned by user
          p.user_id = (auth.jwt() ->> 'sub')::text
          OR
          -- Organization project
          p.clerk_org_id = (auth.jwt() ->> 'org_id')::text
        )
        AND p.deleted_at IS NULL
    )
  );

-- Policy 4: Users can delete hotspots for screens they own
CREATE POLICY "Users can delete hotspots for their screens"
  ON screen_hotspots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM screens s
      JOIN flows f ON s.flow_id = f.id
      JOIN projects p ON f.project_id = p.id
      WHERE s.id = screen_hotspots.screen_id
        AND (
          -- Personal project owned by user
          p.user_id = (auth.jwt() ->> 'sub')::text
          OR
          -- Organization project
          p.clerk_org_id = (auth.jwt() ->> 'org_id')::text
        )
        AND p.deleted_at IS NULL
    )
  );

-- ============================================
-- Verification Queries
-- ============================================

-- Verify table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'screen_hotspots'
ORDER BY ordinal_position;

-- Verify indexes
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'screen_hotspots';

-- Verify RLS is enabled
SELECT 
  tablename, 
  rowsecurity
FROM pg_tables
WHERE tablename = 'screen_hotspots';

-- Verify policies
SELECT 
  policyname, 
  cmd, 
  qual
FROM pg_policies
WHERE tablename = 'screen_hotspots';

