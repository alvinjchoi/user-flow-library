-- Complete setup for parent_flow_id column
-- Run this in Supabase SQL Editor

-- 1. Drop existing column if it has issues (be careful with production data!)
-- Uncomment the next line only if you're sure you want to start fresh
-- ALTER TABLE flows DROP COLUMN IF EXISTS parent_flow_id CASCADE;

-- 2. Add the column with proper settings
ALTER TABLE flows 
ADD COLUMN IF NOT EXISTS parent_flow_id UUID;

-- 3. Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'flows_parent_flow_id_fkey'
  ) THEN
    ALTER TABLE flows 
    ADD CONSTRAINT flows_parent_flow_id_fkey 
    FOREIGN KEY (parent_flow_id) 
    REFERENCES flows(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Add index for performance
CREATE INDEX IF NOT EXISTS idx_flows_parent_flow_id ON flows(parent_flow_id);

-- 5. Add check constraint to prevent self-reference
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'flows_not_self_parent'
  ) THEN
    ALTER TABLE flows 
    ADD CONSTRAINT flows_not_self_parent 
    CHECK (id != parent_flow_id);
  END IF;
END $$;

-- 6. Add column comment
COMMENT ON COLUMN flows.parent_flow_id IS 
  'References another flow that this flow is nested under. Mutually exclusive with parent_screen_id.';

-- 7. Verify the setup
SELECT 
  'parent_flow_id setup complete' as status,
  COUNT(*) as total_flows,
  COUNT(parent_flow_id) as flows_with_parent_flow,
  COUNT(parent_screen_id) as flows_with_parent_screen
FROM flows;

-- 8. Show column details
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'flows'
  AND table_schema = 'public'
  AND column_name IN ('id', 'parent_screen_id', 'parent_flow_id')
ORDER BY ordinal_position;

