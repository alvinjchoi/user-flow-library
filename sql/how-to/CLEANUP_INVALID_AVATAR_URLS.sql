-- Clean up invalid avatar URLs
-- This script will set avatar_url to NULL for any projects where the avatar image is missing
-- Run this if you're seeing 404 errors for project avatars

-- Option 1: Clear ALL avatar URLs (safest option)
-- This will remove all avatar URLs and projects will fall back to color blocks
UPDATE projects
SET avatar_url = NULL
WHERE avatar_url IS NOT NULL;

-- Option 2: Clear only specific invalid avatar URLs
-- Replace 'eba8dfe2-692d-469a-b9a9-f4a26789662c' with the actual ID from your 404 error
UPDATE projects
SET avatar_url = NULL
WHERE avatar_url LIKE '%eba8dfe2-692d-469a-b9a9-f4a26789662c%';

-- Option 3: View all projects with avatar URLs before cleaning up
-- Run this first to see which projects have avatar URLs
SELECT id, name, avatar_url
FROM projects
WHERE avatar_url IS NOT NULL
AND deleted_at IS NULL;

-- After cleaning up, projects will display their color block fallback
-- Users can re-upload avatars from the dashboard

