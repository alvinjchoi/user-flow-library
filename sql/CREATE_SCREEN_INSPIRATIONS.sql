-- Migration: Create screen_inspirations table
-- Description: Add support for manual screen inspiration relationships
-- Date: 2025-10-30

-- Create screen_inspirations table
CREATE TABLE IF NOT EXISTS screen_inspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id UUID NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  related_screen_id UUID NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a screen can't reference itself
  CONSTRAINT no_self_reference CHECK (screen_id != related_screen_id),
  
  -- Prevent duplicate relationships
  CONSTRAINT unique_inspiration UNIQUE (screen_id, related_screen_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_screen_inspirations_screen_id 
  ON screen_inspirations(screen_id);

CREATE INDEX IF NOT EXISTS idx_screen_inspirations_related_screen_id 
  ON screen_inspirations(related_screen_id);

-- Enable RLS
ALTER TABLE screen_inspirations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to read all inspirations
CREATE POLICY "Allow authenticated users to read inspirations"
  ON screen_inspirations
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create inspirations
CREATE POLICY "Allow authenticated users to create inspirations"
  ON screen_inspirations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to delete inspirations
CREATE POLICY "Allow authenticated users to delete inspirations"
  ON screen_inspirations
  FOR DELETE
  TO authenticated
  USING (true);

-- Grant permissions
GRANT ALL ON screen_inspirations TO authenticated;

