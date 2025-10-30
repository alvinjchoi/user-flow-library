-- Add share_token column to projects table for public sharing
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups by share_token
CREATE INDEX IF NOT EXISTS idx_projects_share_token ON projects(share_token) WHERE share_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN projects.share_token IS 'Unique token for public sharing of the project';
COMMENT ON COLUMN projects.is_public IS 'Whether the project is publicly accessible via share link';

