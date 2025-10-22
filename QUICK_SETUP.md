# Quick Setup Guide

## 1. Run the SQL Setup

Go to your Supabase SQL Editor and run the file:

```
sql/CREATE_FLOW_TABLES.sql
```

https://supabase.com/dashboard/project/jrhnlbilfozzrdphcvxp/sql/new

This creates:

- `projects` table
- `flows` table
- `screens` table with hierarchical tree structure
- Sample Discord project with flows and screens

## 2. Start the App

```bash
pnpm run dev
```

Open http://localhost:3000

## 3. Create Your First Project

1. Click "New Project"
2. Enter a project name (e.g., "My App")
3. You'll be taken to the Mobbin-style interface

## 4. Add Flows and Screens

**Using the Tree Sidebar:**

- Click `+` next to "Flow Tree" to add a new flow
- Click `+` next to a flow name to add a screen
- Click `+` next to a screen to add a child screen (nested)

**Example Structure:**

```
Onboarding (Flow)
├── Welcome Screen
├── Phone Entry
│   └── Verification Code
└── Profile Setup
```

## 5. Upload Screenshots

- Click on any screen card in the gallery
- Click "Upload" button
- (File upload UI coming next)

## Done!

You now have a fully functional Mobbin-style user flow organizer!
