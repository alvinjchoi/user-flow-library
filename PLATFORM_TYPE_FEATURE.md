# Platform Type Feature Implementation

## Overview
Added platform type selection (Web, iOS, Android) when creating new projects to help determine appropriate screen dimensions.

## Changes Made

### 1. Database Migration
**File:** `sql/how-to/ADD_PLATFORM_TYPE_TO_PROJECTS.sql`
- Added `platform_type` column to `projects` table
- Column accepts: `'web'`, `'ios'`, `'android'` (default: `'web'`)
- Added database constraint and index for performance
- **Action Required:** Run this SQL migration in your Supabase dashboard

### 2. TypeScript Types
**File:** `lib/database.types.ts`
- Updated `Project` type to include `platform_type: 'web' | 'ios' | 'android'`
- Updated Insert and Update types to support the new field

### 3. Project Creation Function
**File:** `lib/projects.ts`
- Updated `createProject()` function to accept optional `platformType` parameter
- Defaults to `'web'` if not specified

### 4. New Project Dialog Component
**File:** `components/projects/new-project-dialog.tsx` (NEW)
- Beautiful dialog UI for creating projects
- Platform selection with visual icons (Monitor, Smartphone, Tablet)
- Shows expected screen dimensions for each platform:
  - **Web:** 1920×1080 / 1440×900
  - **iOS:** 390×844 (iPhone 14)
  - **Android:** 360×800 / 412×915
- Project name input with Enter key support

### 5. Dashboard Integration
**File:** `app/dashboard/page.tsx`
- Replaced `prompt()` with new `NewProjectDialog` component
- Updated "New Project" and "Create First Project" buttons to open dialog
- Dialog state management integrated into existing dashboard logic

## Platform Type Reference

| Platform | Default Dimensions | Use Case |
|----------|-------------------|----------|
| Web      | 1920×1080 / 1440×900 | Desktop & responsive web apps |
| iOS      | 390×844 (iPhone 14) | iPhone & iPad apps |
| Android  | 360×800 / 412×915 | Android phones & tablets |

## Migration Steps

1. **Run the SQL migration** in your Supabase project:
   ```bash
   # Copy contents of sql/how-to/ADD_PLATFORM_TYPE_TO_PROJECTS.sql
   # Run in Supabase SQL Editor
   ```

2. **Deploy the changes**:
   ```bash
   # All TypeScript changes are ready to deploy
   npm run build
   ```

3. **Test the feature**:
   - Go to `/dashboard`
   - Click "New Project"
   - Select a platform type
   - Verify project is created with correct platform_type

## Platform-Aware UI ✅ IMPLEMENTED

The screen placeholders and cards now automatically adjust their dimensions based on the project's platform type:

- **Web projects**: Display wider containers at **475px × 295px** (16:10 aspect ratio, desktop-like)
- **iOS/Android projects**: Display taller containers at **256px** width with 9:16 aspect ratio (mobile-like)

This applies to:
- "No screens yet" placeholders
- "Add screen" buttons
- All screen cards throughout the project

### Updated Files:
- `components/screens/screen-gallery-by-flow.tsx` - Added platformType prop and dynamic aspect ratios
- `app/projects/[id]/page.tsx` - Passes platformType to ScreenGalleryByFlow
- `app/share/[token]/page.tsx` - Passes platformType to ScreenGalleryByFlow (for shared projects)

## Future Enhancements

- Use `platform_type` to suggest appropriate screen dimensions when uploading screenshots
- Add platform-specific UI component detection
- Filter projects by platform type in dashboard
- Platform-specific templates and starter flows
- Add platform badge/indicator on project cards in dashboard

