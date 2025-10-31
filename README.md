# User Flow Library

A Mobbin-style tool for organizing and managing user flows for your projects with hierarchical screen organization.

## Tech Stack

- **Next.js 15** - App Router
- **Supabase** - PostgreSQL database + Storage
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - UI components

## Data Structure

**Projects** → **Flows** → **Screens** (hierarchical tree)

```
Discord App (Project)
├── Onboarding (Flow)
│   ├── Welcome
│   ├── Phone Entry
│   └── Verification
└── Messages (Flow)
    ├── Inbox
    └── New Message
        ├── Search Friend
        └── Create Group
```

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Supabase

Environment variables are already set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jrhnlbilfozzrdphcvxp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Create Database Tables

Run `sql/CREATE_FLOW_TABLES.sql` in your Supabase SQL Editor:

https://supabase.com/dashboard/project/jrhnlbilfozzrdphcvxp/sql/new

This creates:

- `projects` - Your apps/products
- `flows` - User flows within projects
- `screens` - Individual screens with tree structure
- Auto-updating triggers for counts and paths

### 4. Create Storage Bucket

Run `sql/CREATE_STORAGE_BUCKET.sql` in your Supabase SQL Editor:

This sets up:
- `screenshots` bucket for storing uploaded images
- Public access policies for uploads/downloads

### 5. Start Development

```bash
pnpm run dev
```

Open http://localhost:3000

## Features

- [x] Projects dashboard
- [x] Hierarchical flow tree (Mobbin-style sidebar)
- [x] Screenshot upload with Supabase Storage
- [ ] Drag-and-drop screen ordering
- [ ] Search across projects
- [ ] Export flows
- [ ] Public sharing links

## Project Structure

```
app/
├── page.tsx                    # Projects dashboard
├── projects/
│   └── [id]/
│       ├── page.tsx            # Project detail
│       └── flows/[flowId]/
│           └── page.tsx        # Flow with screen tree

components/
├── projects/                   # Project components
├── flows/                      # Flow tree & cards
└── screens/                    # Screen gallery & upload

lib/
├── projects.ts                 # Project CRUD
├── flows.ts                    # Flow CRUD
└── screens.ts                  # Screen CRUD (tree operations)
```

## Database Schema

### Projects

```sql
id, name, description, color, created_at, updated_at
```

### Flows

```sql
id, project_id, name, description, order_index,
screen_count, created_at, updated_at
```

### Screens (Tree Structure)

```sql
id, flow_id, parent_id, title, screenshot_url, notes,
order_index, level, path, tags, created_at, updated_at
```

## Development

```bash
pnpm run dev      # Start dev server
pnpm run build    # Build for production
pnpm run lint     # Run linter
```

## Deployment

Deploy to Vercel with environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## License

MIT
