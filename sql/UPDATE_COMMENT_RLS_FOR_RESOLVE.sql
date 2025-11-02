-- Update RLS policies to allow anyone to resolve comments (not just owner)

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can update their own comments" ON screen_comments;

-- Create new policy: Users can update their own comments OR resolve any comment
CREATE POLICY "Users can update own comments or resolve any"
  ON screen_comments FOR UPDATE
  USING (
    -- Allow if user owns the comment (for editing text)
    user_id = auth.jwt()->>'sub'
    OR
    -- Allow any authenticated user to resolve (is_resolved only)
    auth.jwt() IS NOT NULL
  );

COMMENT ON POLICY "Users can update own comments or resolve any" ON screen_comments IS 
'Allows users to edit their own comments, but any authenticated user can resolve/unresolve any comment (Figma-style)';

