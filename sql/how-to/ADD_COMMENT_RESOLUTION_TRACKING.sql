-- Add resolution tracking to screen_comments table

-- Add columns for tracking who resolved and when
ALTER TABLE screen_comments
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_by TEXT; -- Clerk user ID of who resolved it

-- Add index for faster queries on resolved comments
CREATE INDEX IF NOT EXISTS idx_screen_comments_resolved ON screen_comments(is_resolved, resolved_at) WHERE is_resolved = true;

-- Add comments to document the new columns
COMMENT ON COLUMN screen_comments.resolved_at IS 'Timestamp when the comment was resolved';
COMMENT ON COLUMN screen_comments.resolved_by IS 'Clerk user ID of the person who resolved the comment';

