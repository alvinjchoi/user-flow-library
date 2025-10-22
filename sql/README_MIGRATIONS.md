# SQL Migration Scripts

## 🎯 Purpose

These scripts help you set up and maintain the dual naming system for your user flow organizer.

## 📋 Migration Order

### 1️⃣ **First Time Setup**

If you haven't created the tables yet:

```bash
1. Run: sql/CREATE_FLOW_TABLES.sql
2. Run: sql/ADD_PARENT_SCREEN_ID_TO_FLOWS.sql
3. Run: sql/CREATE_STORAGE_BUCKET.sql
4. Run: sql/ADD_DISPLAY_NAME_TO_SCREENS.sql
```

### 2️⃣ **Data Inspection** (if tables already exist)

```bash
Run: sql/INSPECT_DATA.sql
```

This will show you:
- Whether tables exist
- Current column structure
- How many records you have
- Your project/flow/screen hierarchy
- Which screens need `display_name` added

### 3️⃣ **Display Name Migration**

```bash
Run: sql/MIGRATE_DISPLAY_NAMES.sql
```

This script has **two migration options**:

#### Option A: Simple Copy (Recommended First)
Copies `title` → `display_name` to preserve existing names:
```sql
UPDATE screens 
SET display_name = title 
WHERE display_name IS NULL;
```

#### Option B: Smart Conversion
Attempts to convert technical names to action-oriented names:
- "Login Screen" → "Signing in"
- "Search Screen" → "Searching"
- "Profile Screen" → "User profile"

## 🔍 How to Use

### Step 1: Connect to Your Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select project: `jrhnlbilfozzrdphcvxp`
3. Click **SQL Editor** in the left sidebar

### Step 2: Run Inspection Script

Copy and paste `INSPECT_DATA.sql` into the SQL Editor and run it.

Review the output to understand your current data.

### Step 3: Run Migration Script

Copy and paste `MIGRATE_DISPLAY_NAMES.sql` into the SQL Editor.

**Important:** The migration queries are commented out with `/* */`. 

Uncomment the option you want:
- For simple copy: Uncomment **Option A**
- For smart conversion: Uncomment **Option B**

### Step 4: Verify Results

The migration script includes verification queries that will show:
- Technical names vs. sidebar names
- Screens that still need manual review
- Naming status (same vs. different)

## 📊 Expected Results

After migration, you should have:

| Screen ID | title (Gallery) | display_name (Sidebar) | Status |
|-----------|----------------|----------------------|--------|
| uuid-1 | Login Screen | Signing in | ✅ Different |
| uuid-2 | Search Screen | Searching Reddit | ✅ Different |
| uuid-3 | User profile | User profile | ⚠️ Same |

## 🎨 Naming Guidelines

### For `title` (Technical / Gallery / Developer Reference):
- "Login Screen"
- "Search Screen"
- "Profile Screen"
- "Settings Screen"
- "Chat Screen"

### For `display_name` (Action-Oriented / Sidebar / UX Flow):
- "Signing in"
- "Searching Reddit"
- "User profile"
- "Chat settings"
- "Sending a chat"

## 🔄 Future Uploads

Once this is set up, the AI will automatically generate both:
- ✅ Technical name for developers
- ✅ Action-oriented name for sidebar

## 🆘 Troubleshooting

### Issue: "relation 'screens' does not exist"
**Solution:** Run `CREATE_FLOW_TABLES.sql` first

### Issue: "column 'display_name' already exists"
**Solution:** That's fine! Skip `ADD_DISPLAY_NAME_TO_SCREENS.sql` and go straight to migration

### Issue: MCP showing wrong project
**Solution:** MCP is connected to a different Supabase project. Always use the Supabase dashboard SQL Editor for `jrhnlbilfozzrdphcvxp`

## 📝 Manual Review Recommendations

After running the migration, manually review and update display names for:
1. Main entry points (login, onboarding)
2. Key user actions (posting, commenting, sharing)
3. Settings and configuration screens
4. Any screens that branched out from parents

Use the Mobbin-style naming convention for consistency!

