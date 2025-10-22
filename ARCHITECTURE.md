# Architecture Overview

## Tech Stack

### Frontend & Backend (Monorepo)
- **Next.js 15** - Full-stack React framework with App Router
  - Frontend: React components with TypeScript
  - Backend: API Routes (serverless functions)
  - No need for separate backend deployment

### Why Next.js API Routes?
✅ **Built-in**: API routes are part of Next.js
✅ **Serverless**: Auto-scales, no server management
✅ **Same Codebase**: Frontend + backend in one repo
✅ **TypeScript**: Shared types between frontend/backend
✅ **Easy Deployment**: Single deploy to Vercel

### Database & Storage
- **Supabase** (PostgreSQL)
  - Hosted database with REST API
  - Built-in authentication & RLS
  - File storage for screenshots

### AI Integration
- **OpenAI GPT-4 Vision API**
  - Serverless API route: `/api/analyze-screenshot`
  - Runs on Vercel Edge (in production) or Node (in dev)

## Project Structure

```
v0-pattern-library/
├── app/                          # Next.js App Router
│   ├── api/                      # Backend API routes
│   │   └── analyze-screenshot/   # OpenAI integration
│   ├── projects/[id]/            # Project detail page
│   └── page.tsx                  # Homepage
├── components/                   # React components
│   ├── flow-tree/                # Sidebar tree components
│   ├── screens/                  # Screen gallery & dialogs
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utility functions
│   ├── supabase.ts               # Supabase client
│   ├── flows.ts                  # Database operations
│   └── storage.ts                # File upload
└── sql/                          # Database migrations
```

## Data Flow

### 1. Screenshot Upload with AI Analysis
```
User uploads image
    ↓
UploadDialog component
    ↓
Upload to Supabase Storage (lib/storage.ts)
    ↓
POST /api/analyze-screenshot (server-side)
    ↓
OpenAI GPT-4 Vision API
    ↓
Return title + description
    ↓
Update screen in database
    ↓
Optimistic UI update
```

### 2. Database Operations
```
Component event (e.g., add screen)
    ↓
Call lib/flows.ts function
    ↓
Supabase REST API
    ↓
PostgreSQL database
    ↓
Return updated data
    ↓
Update local state (optimistic UI)
```

## Why Not Separate Backend?

### Current Setup (Recommended)
- ✅ **Simpler**: One codebase, one deployment
- ✅ **Faster**: No CORS, shared types
- ✅ **Cheaper**: One hosting service (Vercel free tier)
- ✅ **Type-safe**: Share TypeScript types
- ✅ **Auto-scaling**: Vercel handles serverless

### When to Separate?
Consider separating backend only if:
- Need long-running background jobs (>10s)
- Need WebSocket connections
- Have complex business logic
- Need different scaling for API vs UI
- Want to use a different language

For this app, Next.js API routes are perfect! 🎉

## Deployment

### Development
```bash
pnpm dev  # Runs Next.js dev server
          # API routes work at /api/*
```

### Production (Vercel - Recommended)
```bash
git push  # Auto-deploys if connected to Vercel
# OR
vercel   # Manual deploy
```

Both frontend and API routes deploy together! No separate backend needed.

### Environment Variables
Development: `.env.local`
Production: Set in Vercel Dashboard → Settings → Environment Variables

## API Routes Details

### `/api/analyze-screenshot`
- **Method**: POST
- **Input**: `{ imageUrl: string, context: Screen[] }`
- **Output**: `{ title: string, description: string }`
- **Runtime**: Node.js (serverless)
- **Timeout**: 10s default (enough for OpenAI)

### How API Routes Work
1. Files in `app/api/*/route.ts` become API endpoints
2. Run server-side only (secure)
3. Can access environment variables
4. Auto-deployed with your app

No Express, no separate server, no extra deployment! 🚀

