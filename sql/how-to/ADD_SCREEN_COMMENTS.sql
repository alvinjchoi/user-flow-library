-- Create screen_comments table for Figma-style commenting
CREATE TABLE IF NOT EXISTS screen_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id UUID NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Clerk user ID
  user_name TEXT, -- Cached user name for display
  user_avatar TEXT, -- Cached user avatar URL
  
  -- Position on screenshot (percentage-based for responsive scaling)
  x_position DECIMAL(5,2) NOT NULL CHECK (x_position >= 0 AND x_position <= 100),
  y_position DECIMAL(5,2) NOT NULL CHECK (y_position >= 0 AND y_position <= 100),
  
  comment_text TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  
  -- For threaded replies
  parent_comment_id UUID REFERENCES screen_comments(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_screen_comments_screen_id ON screen_comments(screen_id);
CREATE INDEX IF NOT EXISTS idx_screen_comments_parent_id ON screen_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_screen_comments_user_id ON screen_comments(user_id);

-- Add RLS policies for Clerk authentication
ALTER TABLE screen_comments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all comments on screens they can access
CREATE POLICY "Users can view comments on accessible screens"
  ON screen_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM screens s
      JOIN flows f ON s.flow_id = f.id
      WHERE s.id = screen_comments.screen_id
    )
  );

-- Allow authenticated users to insert comments
CREATE POLICY "Authenticated users can create comments"
  ON screen_comments FOR INSERT
  WITH CHECK (auth.jwt() IS NOT NULL);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments"
  ON screen_comments FOR UPDATE
  USING (user_id = auth.jwt()->>'sub');

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON screen_comments FOR DELETE
  USING (user_id = auth.jwt()->>'sub');

-- Add comment to track changes
COMMENT ON TABLE screen_comments IS 'Stores user comments on screenshots with x,y coordinates for Figma-style annotations';

