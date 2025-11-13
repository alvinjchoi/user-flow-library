# SQL Migration Guide

Use this guide when you need to apply database changes in Supabase. Every script lives in the same Diátaxis quadrant as described in `sql/README.md`.

## Fresh Project Setup

1. Run `sql/reference/CREATE_FLOW_TABLES.sql` to provision the `projects`, `flows`, and `screens` tables along with triggers and helper indexes.
2. Add hierarchical navigation support as needed:
   - `sql/how-to/ADD_PARENT_FLOW_ID.sql`
   - `sql/how-to/ADD_PARENT_SCREEN_ID_TO_FLOWS.sql`
   - `sql/how-to/COMPLETE_PARENT_FLOW_ID_SETUP.sql` (rebuilds constraints if the column was created incorrectly).
3. Add user-facing naming improvements with `sql/how-to/ADD_DISPLAY_NAME_TO_SCREENS.sql`.
4. Enable soft deletes and sharing features:
   - `sql/how-to/ADD_SOFT_DELETE_SUPPORT.sql`
   - `sql/how-to/ADD_PROJECT_SHARING.sql` (public links)
   - `sql/how-to/ADD_PROJECT_AVATAR_SUPPORT.sql` (metadata column)
   - `sql/how-to/SETUP_PROJECT_AVATARS_COMPLETE.sql` (storage bucket and policies).

## Collaboration & Authentication

- For a one-shot upgrade that adds `user_id`, Clerk organization support, and hardened RLS policies, run `sql/tutorials/COMBINED_SETUP.sql` after the core schema exists.
- If you prefer modular upgrades:
  - `sql/how-to/ADD_USER_OWNERSHIP_TO_PROJECTS.sql`
  - `sql/how-to/ADD_CLERK_ORGANIZATIONS.sql`
  - `sql/how-to/ADD_ORGANIZATIONS_AND_PERMISSIONS.sql`
  - `sql/how-to/ASSIGN_PROJECTS_TO_ORG.sql` (optional backfill)
  - `sql/how-to/OPTIONAL_PROFILES_AND_ORGS.sql` (extended profile data).

## Collaboration Features

1. Comments:
   - Create the table with `sql/how-to/ADD_SCREEN_COMMENTS.sql`.
   - Add resolution metadata via `sql/how-to/ADD_COMMENT_RESOLUTION_TRACKING.sql`.
   - If users cannot resolve comments, re-run the relaxed policy in `sql/explanations/UPDATE_COMMENT_RLS_FOR_RESOLVE.sql`.
2. Hotspots:
   - Provision the feature with `sql/how-to/ADD_SCREEN_HOTSPOTS.sql`.
   - Use `sql/explanations/DEBUG_HOTSPOTS_RLS.sql` to inspect JWT claims when policies fail.
   - Apply `sql/explanations/FIX_HOTSPOTS_RLS.sql` or `sql/explanations/FIX_HOTSPOTS_RLS_V2.sql` if you need to rebuild the policies.

## Troubleshooting & Verification

- `sql/explanations/VERIFY_AND_FIX_PARENT_FLOW_ID.sql` – sanity-checks the `parent_flow_id` column and backfills missing values.
- `sql/explanations/FIX_CLERK_RLS_POLICIES.sql` – reinstates storage policies for the `project-avatars` bucket when Clerk roles change.

## Running Scripts Safely

1. Open the Supabase SQL Editor for your project (`https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new`).
2. Paste one script at a time and run it. The scripts are idempotent (`IF NOT EXISTS` checks) so they can be re-run safely.
3. For destructive steps, read the inline comments and uncomment only when you are sure (for example, dropping columns or policies).
4. After major changes, refresh the Supabase table view or re-run the verification scripts listed above.
