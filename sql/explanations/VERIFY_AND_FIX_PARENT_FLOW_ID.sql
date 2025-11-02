-- Step 1: Check if parent_flow_id column exists
DO $$ 
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'flows' 
      AND column_name = 'parent_flow_id'
  ) THEN
    -- Column doesn't exist, add it
    RAISE NOTICE 'Adding parent_flow_id column...';
    ALTER TABLE flows ADD COLUMN parent_flow_id UUID REFERENCES flows(id) ON DELETE CASCADE;
  ELSE
    RAISE NOTICE 'parent_flow_id column already exists';
  END IF;
END $$;

-- Step 2: Add index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_flows_parent_flow_id ON flows(parent_flow_id);

-- Step 3: Add constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'flows_not_self_parent'
  ) THEN
    ALTER TABLE flows ADD CONSTRAINT flows_not_self_parent CHECK (id != parent_flow_id);
  END IF;
END $$;

-- Step 4: Verify the column exists and show structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'flows'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 5: Show count of flows with parent_flow_id
SELECT 
  COUNT(*) FILTER (WHERE parent_flow_id IS NOT NULL) as with_parent_flow,
  COUNT(*) FILTER (WHERE parent_screen_id IS NOT NULL) as with_parent_screen,
  COUNT(*) FILTER (WHERE parent_flow_id IS NULL AND parent_screen_id IS NULL) as top_level,
  COUNT(*) as total
FROM flows;

