# Setup Checklist

Follow these steps to get your User Flow Organizer running:

## ✅ Step 1: Install Dependencies
```bash
pnpm install
```

## ✅ Step 2: Environment Variables
Create `.env.local` in the project root:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://jrhnlbilfozzrdphcvxp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (Optional - for AI screenshot analysis)
OPENAI_API_KEY=your-openai-api-key
```

## ⚠️ Step 3: Run Database Migrations

Go to: https://supabase.com/dashboard/project/jrhnlbilfozzrdphcvxp/sql/new

### 3.1: Create Main Tables
Run `sql/CREATE_FLOW_TABLES.sql` to create:
- `projects` table
- `flows` table
- `screens` table
- Triggers and RLS policies

### 3.2: Add Flow Branching Support
Run `sql/ADD_PARENT_SCREEN_ID_TO_FLOWS.sql` to add:
- `parent_screen_id` column to flows table
- Index for performance

### 3.3: Create Storage Bucket
Run `sql/CREATE_STORAGE_BUCKET.sql` to set up:
- `screenshots` bucket for image uploads
- Public access policies

## ⚠️ Step 4: Restart Dev Server
**Important**: After adding environment variables, you MUST restart the dev server:
```bash
# Stop the current server (Ctrl+C)
pnpm dev
```

## 🚀 Step 5: Test
1. Go to http://localhost:3000
2. Create a project
3. Add a flow
4. Add screens
5. Upload a screenshot (AI will analyze it)

## Common Issues

### "Could not find the 'parent_screen_id' column"
- Run `sql/ADD_PARENT_SCREEN_ID_TO_FLOWS.sql` in Supabase SQL Editor

### "Missing credentials" for OpenAI
- Make sure `OPENAI_API_KEY` is in `.env.local`
- **Restart the dev server** to pick up the new environment variable

### AI analysis fails
- Check that your OpenAI API key is valid
- Check that you have credits in your OpenAI account
- The app will still work without AI - you just won't get auto-naming

### Screenshots not uploading
- Run `sql/CREATE_STORAGE_BUCKET.sql`
- Make sure the bucket is public in Supabase Dashboard

