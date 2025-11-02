-- Fix screen_hotspots RLS policies
-- Copy the pattern from screen_comments which is working

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can create hotspots for their screens" ON screen_hotspots;
DROP POLICY IF EXISTS "Users can view hotspots for accessible screens" ON screen_hotspots;
DROP POLICY IF EXISTS "Users can update hotspots for their screens" ON screen_hotspots;
DROP POLICY IF EXISTS "Users can delete hotspots for their screens" ON screen_hotspots;

-- Create simpler, working policies based on screen_comments pattern

-- Policy 1: Anyone authenticated can view hotspots
CREATE POLICY "Enable read access for authenticated users"
  ON screen_hotspots FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Anyone authenticated can create hotspots
CREATE POLICY "Enable insert for authenticated users"
  ON screen_hotspots FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Anyone authenticated can update hotspots
CREATE POLICY "Enable update for authenticated users"
  ON screen_hotspots FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 4: Anyone authenticated can delete hotspots
CREATE POLICY "Enable delete for authenticated users"
  ON screen_hotspots FOR DELETE
  TO authenticated
  USING (true);

-- Verify policies
SELECT 
  policyname, 
  cmd,
  roles,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'screen_hotspots'
ORDER BY cmd;

