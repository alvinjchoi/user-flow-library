-- =====================================================
-- Fix project-images Upload Policy
-- =====================================================
-- Updates the existing policy to actually check authentication
-- =====================================================

-- Drop the existing policy that doesn't check authentication
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

-- Create a new policy that actually checks authentication
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-images' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- Verify Setup
-- =====================================================
SELECT 
  'policy_fixed' as status,
  'project-images upload policy now checks authentication' as description;
