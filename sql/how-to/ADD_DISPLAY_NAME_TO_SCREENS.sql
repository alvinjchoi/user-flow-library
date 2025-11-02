-- Migration: Add display_name field for action-oriented naming in sidebar
-- This enables dual naming: display_name for UX flows, title for developer reference

-- Add display_name column
ALTER TABLE screens
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add comment explaining the purpose
COMMENT ON COLUMN screens.display_name IS 'Action-oriented name for sidebar display (e.g., "Searching Reddit"). Falls back to title if not set.';

-- Optional: Copy existing titles to display_name for backward compatibility
-- UPDATE screens SET display_name = title WHERE display_name IS NULL;

