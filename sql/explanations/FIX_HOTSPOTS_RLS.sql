-- Fix screen_hotspots RLS policies
-- Drop and recreate INSERT policy with proper WITH CHECK clause

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create hotspots for their screens" ON screen_hotspots;

-- Recreate with explicit WITH CHECK
CREATE POLICY "Users can create hotspots for their screens"
  ON screen_hotspots FOR INSERT
  TO authenticated
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

-- Also update SELECT policy to be more explicit
DROP POLICY IF EXISTS "Users can view hotspots for accessible screens" ON screen_hotspots;

CREATE POLICY "Users can view hotspots for accessible screens"
  ON screen_hotspots FOR SELECT
  TO authenticated
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

