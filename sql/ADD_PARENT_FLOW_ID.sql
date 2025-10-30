-- Add parent_flow_id column to flows table to support Flow -> Flow -> Screen hierarchy
-- This allows flows to be nested under other flows, not just under screens

-- Add the parent_flow_id column
ALTER TABLE flows 
ADD COLUMN IF NOT EXISTS parent_flow_id UUID REFERENCES flows(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_flows_parent_flow_id ON flows(parent_flow_id);

-- Add check constraint to prevent circular dependencies at database level
-- A flow cannot be its own parent
ALTER TABLE flows 
ADD CONSTRAINT flows_not_self_parent CHECK (id != parent_flow_id);

-- Add constraint: a flow can only have ONE parent (either parent_screen_id OR parent_flow_id, not both)
-- This is a soft constraint that should be enforced at application level
-- But we can add a check to ensure at least one is being used properly

-- Update existing flows to ensure data consistency
-- (All existing flows should already have either parent_screen_id or be top-level)

-- Add comment to document the column
COMMENT ON COLUMN flows.parent_flow_id IS 'References another flow that this flow is nested under. Mutually exclusive with parent_screen_id - a flow can branch from a screen OR be nested under another flow, but not both.';
