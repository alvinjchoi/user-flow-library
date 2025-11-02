# SQL Playbook

The SQL folder follows the Diátaxis framework so you can find the right script for the job.

## Tutorials

- `tutorials/COMBINED_SETUP.sql` – end-to-end bootstrap for user ownership and Clerk organization policies.

## How-To Guides

- `how-to/ADD_CLERK_ORGANIZATIONS.sql` – enable Clerk organizations and shared access controls.
- `how-to/ADD_COMMENT_RESOLUTION_TRACKING.sql` – track who resolves comments and when.
- `how-to/ADD_DISPLAY_NAME_TO_SCREENS.sql` – add sidebar-friendly `display_name` naming to screens.
- `how-to/ADD_ORGANIZATIONS_AND_PERMISSIONS.sql` – create full organizations + membership schema.
- `how-to/ADD_PARENT_FLOW_ID.sql` – nest flows under other flows.
- `how-to/ADD_PARENT_SCREEN_ID_TO_FLOWS.sql` – branch flows from a specific screen.
- `how-to/ADD_PROJECT_AVATAR_SUPPORT.sql` – store avatar metadata on projects.
- `how-to/ADD_PROJECT_SHARING.sql` – add public sharing tokens and flags to projects.
- `how-to/ADD_SCREEN_COMMENTS.sql` – create the `screen_comments` table with RLS policies.
- `how-to/ADD_SCREEN_HOTSPOTS.sql` – add interactive hotspot support for prototype mode.
- `how-to/ADD_SOFT_DELETE_SUPPORT.sql` – introduce `deleted_at` soft-delete columns.
- `how-to/ADD_USER_OWNERSHIP_TO_PROJECTS.sql` – add a `user_id` column and secure it with RLS.
- `how-to/ASSIGN_PROJECTS_TO_ORG.sql` – backfill existing projects to a Clerk organization.
- `how-to/COMPLETE_PARENT_FLOW_ID_SETUP.sql` – reapply constraints and indexes for `parent_flow_id`.
- `how-to/OPTIONAL_PROFILES_AND_ORGS.sql` – create extended `profiles` and `organizations` tables.
- `how-to/SETUP_PROJECT_AVATARS_COMPLETE.sql` – provision the `project-avatars` storage bucket and policies.

## Reference

- `reference/CREATE_FLOW_TABLES.sql` – baseline tables, triggers, and indexes for projects, flows, and screens.
- `reference/CREATE_SCREEN_INSPIRATIONS.sql` – supporting table for curated inspiration screens.
- `reference/migration-guide.md` – recommended order for applying migrations in Supabase.

## Explanations

- `explanations/DEBUG_HOTSPOTS_RLS.sql` – inspect policies and JWT claims when hotspots fail.
- `explanations/FIX_CLERK_RLS_POLICIES.sql` – repair storage policies for Clerk-authenticated users.
- `explanations/FIX_HOTSPOTS_RLS.sql` – drop and recreate hotspot policies (original fix).
- `explanations/FIX_HOTSPOTS_RLS_V2.sql` – hardened hotspot policies that mirror comment rules.
- `explanations/UPDATE_COMMENT_RLS_FOR_RESOLVE.sql` – loosen comment update policies so anyone can resolve threads.
- `explanations/VERIFY_AND_FIX_PARENT_FLOW_ID.sql` – check for missing columns, indexes, and backfill parent flow data.
