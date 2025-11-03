-- =============================================================================
-- CRITICAL SECURITY FIX: Remove public policies and fix flows/screens RLS
-- =============================================================================

-- =============================================================================
-- STEP 1: DROP ALL DANGEROUS PUBLIC POLICIES
-- =============================================================================

-- Flows
DROP POLICY IF EXISTS "public_read_flows" ON flows;
DROP POLICY IF EXISTS "public_insert_flows" ON flows;
DROP POLICY IF EXISTS "public_update_flows" ON flows;
DROP POLICY IF EXISTS "public_delete_flows" ON flows;

-- Screens
DROP POLICY IF EXISTS "public_read_screens" ON screens;
DROP POLICY IF EXISTS "public_insert_screens" ON screens;
DROP POLICY IF EXISTS "public_update_screens" ON screens;
DROP POLICY IF EXISTS "public_delete_screens" ON screens;

-- =============================================================================
-- STEP 2: DROP OLD BROKEN POLICIES (don't check ownership)
-- =============================================================================

-- Flows
DROP POLICY IF EXISTS "Users can view flows" ON flows;
DROP POLICY IF EXISTS "Users can create flows" ON flows;
DROP POLICY IF EXISTS "Users can update flows" ON flows;
DROP POLICY IF EXISTS "Users can delete flows" ON flows;

-- Screens
DROP POLICY IF EXISTS "Users can view screens" ON screens;
DROP POLICY IF EXISTS "Users can create screens" ON screens;
DROP POLICY IF EXISTS "Users can update screens" ON screens;
DROP POLICY IF EXISTS "Users can delete screens" ON screens;

-- =============================================================================
-- STEP 3: CREATE NEW SECURE POLICIES FOR FLOWS
-- =============================================================================

-- SELECT: Users can view flows from projects they have access to
CREATE POLICY "select_flows_via_project_access"
ON flows
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = flows.project_id
      AND projects.deleted_at IS NULL
      AND (
        -- User owns the project
        (auth.jwt() ->> 'sub')::text = projects.user_id
        OR
        -- Project belongs to user's organization
        (auth.jwt() -> 'org_id')::text = projects.clerk_org_id
      )
  )
);

-- INSERT: Users can create flows in their projects
CREATE POLICY "insert_flows_in_own_projects"
ON flows
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = flows.project_id
      AND projects.deleted_at IS NULL
      AND (
        (auth.jwt() ->> 'sub')::text = projects.user_id
        OR
        (auth.jwt() -> 'org_id')::text = projects.clerk_org_id
      )
  )
);

-- UPDATE: Users can update flows in their projects
CREATE POLICY "update_flows_in_own_projects"
ON flows
FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = flows.project_id
      AND projects.deleted_at IS NULL
      AND (
        (auth.jwt() ->> 'sub')::text = projects.user_id
        OR
        (auth.jwt() -> 'org_id')::text = projects.clerk_org_id
      )
  )
);

-- DELETE: Users can soft-delete flows in their projects
CREATE POLICY "delete_flows_in_own_projects"
ON flows
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = flows.project_id
      AND projects.deleted_at IS NULL
      AND (
        (auth.jwt() ->> 'sub')::text = projects.user_id
        OR
        (auth.jwt() -> 'org_id')::text = projects.clerk_org_id
      )
  )
);

-- =============================================================================
-- STEP 4: CREATE NEW SECURE POLICIES FOR SCREENS
-- =============================================================================

-- SELECT: Users can view screens from flows in projects they have access to
CREATE POLICY "select_screens_via_project_access"
ON screens
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM flows
    INNER JOIN projects ON projects.id = flows.project_id
    WHERE flows.id = screens.flow_id
      AND flows.deleted_at IS NULL
      AND projects.deleted_at IS NULL
      AND (
        (auth.jwt() ->> 'sub')::text = projects.user_id
        OR
        (auth.jwt() -> 'org_id')::text = projects.clerk_org_id
      )
  )
);

-- INSERT: Users can create screens in flows they have access to
CREATE POLICY "insert_screens_in_own_flows"
ON screens
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM flows
    INNER JOIN projects ON projects.id = flows.project_id
    WHERE flows.id = screens.flow_id
      AND flows.deleted_at IS NULL
      AND projects.deleted_at IS NULL
      AND (
        (auth.jwt() ->> 'sub')::text = projects.user_id
        OR
        (auth.jwt() -> 'org_id')::text = projects.clerk_org_id
      )
  )
);

-- UPDATE: Users can update screens in flows they have access to
CREATE POLICY "update_screens_in_own_flows"
ON screens
FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM flows
    INNER JOIN projects ON projects.id = flows.project_id
    WHERE flows.id = screens.flow_id
      AND flows.deleted_at IS NULL
      AND projects.deleted_at IS NULL
      AND (
        (auth.jwt() ->> 'sub')::text = projects.user_id
        OR
        (auth.jwt() -> 'org_id')::text = projects.clerk_org_id
      )
  )
);

-- DELETE: Users can soft-delete screens in flows they have access to
CREATE POLICY "delete_screens_in_own_flows"
ON screens
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM flows
    INNER JOIN projects ON projects.id = flows.project_id
    WHERE flows.id = screens.flow_id
      AND flows.deleted_at IS NULL
      AND projects.deleted_at IS NULL
      AND (
        (auth.jwt() ->> 'sub')::text = projects.user_id
        OR
        (auth.jwt() -> 'org_id')::text = projects.clerk_org_id
      )
  )
);

-- =============================================================================
-- STEP 5: VERIFY NEW POLICIES
-- =============================================================================

-- Should show ONLY the new policies (4 for flows, 4 for screens)
SELECT 
  tablename,
  policyname,
  cmd,
  LEFT(qual::text, 80) as "policy_condition"
FROM pg_policies
WHERE tablename IN ('flows', 'screens')
ORDER BY tablename, policyname;

-- =============================================================================
-- Expected result:
-- flows   | delete_flows_in_own_projects       | UPDATE | EXISTS ( SELECT 1 FROM projects...
-- flows   | insert_flows_in_own_projects       | INSERT | null (checked in WITH CHECK)
-- flows   | select_flows_via_project_access    | SELECT | ((deleted_at IS NULL) AND EXISTS...
-- flows   | update_flows_in_own_projects       | UPDATE | ((deleted_at IS NULL) AND EXISTS...
-- screens | delete_screens_in_own_flows        | UPDATE | EXISTS ( SELECT 1 FROM flows...
-- screens | insert_screens_in_own_flows        | INSERT | null (checked in WITH CHECK)
-- screens | select_screens_via_project_access  | SELECT | ((deleted_at IS NULL) AND EXISTS...
-- screens | update_screens_in_own_flows        | UPDATE | ((deleted_at IS NULL) AND EXISTS...
-- =============================================================================

