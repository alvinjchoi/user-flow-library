-- =====================================================
-- Manual Display Name Updates
-- =====================================================
-- Updates the 6 remaining screens with action-oriented names
-- Following Mobbin-style naming conventions
-- =====================================================

-- BEFORE: Show current state
SELECT 
  s.id,
  s.title,
  s.display_name,
  f.name as flow_name,
  p.name as project_name
FROM screens s
JOIN flows f ON s.flow_id = f.id
JOIN projects p ON f.project_id = p.id
WHERE s.id IN (
  'f08da1b8-b9c0-48cb-b86f-b300e36b1d0c',
  '6c8e2e54-2998-40be-bffa-71df5b0f0231',
  '5c0dbb44-795e-4c74-9479-471156d15f03',
  'f4b7ab59-4f88-479e-9796-e75d7c246209',
  '14c40888-a916-4847-87e8-8e9fda3e351b',
  '3e9db285-90c6-4409-b80f-41dd681be129'
)
ORDER BY p.name, f.name;

-- =====================================================
-- Apply Updates
-- =====================================================

-- Discord Mobile App - Onboarding Flow
UPDATE screens 
SET display_name = 'Entering phone number'
WHERE id = 'f08da1b8-b9c0-48cb-b86f-b300e36b1d0c';
-- Was: "Phone Entry" → Now: "Entering phone number"

UPDATE screens 
SET display_name = 'Verifying phone number'
WHERE id = '6c8e2e54-2998-40be-bffa-71df5b0f0231';
-- Was: "Verification" → Now: "Verifying phone number"

-- Moiio - Home Flow (Community Feed screens - BOTH should be same)
UPDATE screens 
SET display_name = 'Browsing community'
WHERE id = '5c0dbb44-795e-4c74-9479-471156d15f03';
-- Was: "Community Feed" → Now: "Browsing community"

UPDATE screens 
SET display_name = 'Browsing community'
WHERE id = 'f4b7ab59-4f88-479e-9796-e75d7c246209';
-- Was: "Community Feed" → Now: "Browsing community" (same screen, likely scroll capture)

-- Moiio - Onboarding Flow (Google Sign-In)
UPDATE screens 
SET display_name = 'Authorizing Google sign-in'
WHERE id = '14c40888-a916-4847-87e8-8e9fda3e351b';
-- Was: "Google Sign-In Permission" → Now: "Authorizing Google sign-in"

UPDATE screens 
SET display_name = 'Selecting Google account'
WHERE id = '3e9db285-90c6-4409-b80f-41dd681be129';
-- Was: "Google Account Selection" → Now: "Selecting Google account"

-- =====================================================
-- AFTER: Show updated state
-- =====================================================
SELECT 
  s.id,
  s.title as technical_name,
  s.display_name as sidebar_name,
  '✅ Updated' as status,
  f.name as flow_name,
  p.name as project_name
FROM screens s
JOIN flows f ON s.flow_id = f.id
JOIN projects p ON f.project_id = p.id
WHERE s.id IN (
  'f08da1b8-b9c0-48cb-b86f-b300e36b1d0c',
  '6c8e2e54-2998-40be-bffa-71df5b0f0231',
  '5c0dbb44-795e-4c74-9479-471156d15f03',
  'f4b7ab59-4f88-479e-9796-e75d7c246209',
  '14c40888-a916-4847-87e8-8e9fda3e351b',
  '3e9db285-90c6-4409-b80f-41dd681be129'
)
ORDER BY p.name, f.name;

-- =====================================================
-- Final Summary
-- =====================================================
SELECT 
  COUNT(*) as total_screens,
  COUNT(CASE WHEN display_name IS NOT NULL THEN 1 END) as with_display_name,
  COUNT(CASE WHEN title != display_name THEN 1 END) as properly_differentiated,
  ROUND(100.0 * COUNT(CASE WHEN title != display_name THEN 1 END) / COUNT(*), 1) as differentiation_percentage
FROM screens;

-- Check: No more screens need review
SELECT 
  COUNT(*) as screens_still_needing_review
FROM screens 
WHERE title = display_name;

