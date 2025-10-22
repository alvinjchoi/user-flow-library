-- Migration: Add parent_screen_id column to flows table
-- This enables flow branching (e.g., "Sign in with Google" from "Sign in & Sign up" screen)

-- Add the parent_screen_id column
ALTER TABLE flows
ADD COLUMN IF NOT EXISTS parent_screen_id UUID REFERENCES screens(id) ON DELETE SET NULL;

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_flows_parent_screen_id ON flows(parent_screen_id);

-- Update the function that returns flow display names
-- This is used to show "Flow Name from Parent Screen"
COMMENT ON COLUMN flows.parent_screen_id IS 'Optional reference to the screen this flow branches from';

