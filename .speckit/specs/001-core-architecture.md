# Specification: Core Architecture

**ID:** SPEC-001  
**Status:** ✅ Implemented  
**Created:** 2024-11-04  
**Last Updated:** 2024-11-04

## Overview

User Flow Library is a Mobbin-style interface for organizing projects, flows, and screens in a hierarchical tree structure with AI-assisted hotspot detection.

## Requirements

### FR-001: Project Management

**Priority:** P0 (Critical)

Users shall be able to:

- Create, read, update, and delete projects
- Organize projects within organizations (multi-tenant)
- Upload project avatars
- Set project platform type (web, iOS, Android)
- Share projects publicly via unique URLs

### FR-002: Flow Management

**Priority:** P0 (Critical)

Users shall be able to:

- Create flows within projects
- Nest flows hierarchically (parent-child relationships)
- Reorder flows via drag-and-drop
- Move flows between parents
- Delete flows (cascades to screens)

### FR-003: Screen Management

**Priority:** P0 (Critical)

Users shall be able to:

- Add screens to flows
- Upload screenshots for screens
- Nest screens hierarchically
- Reorder screens within flows
- Edit screen metadata (title, displayName, notes)
- Delete screens

### FR-004: Hotspot Detection

**Priority:** P1 (High)

System shall:

- Detect interactive UI elements in screenshots
- Generate bounding boxes with percentage-based coordinates
- Support multiple AI backends (GPT-4 Vision, UIED)
- Allow manual hotspot creation and editing
- Link hotspots to target screens (navigation)

### FR-005: Authentication & Authorization

**Priority:** P0 (Critical)

System shall:

- Authenticate users via Clerk
- Support organization-based access control
- Enforce Row Level Security (RLS) in database
- Isolate data by organization
- Support public sharing without authentication

## Technical Architecture

### Frontend

- **Framework:** Next.js 15 App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui (Radix UI)
- **Auth:** Clerk

### Backend

- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Auth:** Clerk JWT → Supabase RLS
- **AI:** GPT-4 Vision API, optional Python UIED service

### Domain Model

```
Organization (Clerk)
  ↓
Project
  ├── user_id
  ├── clerk_org_id
  └── Flow[]
       ├── parent_flow_id
       ├── parent_screen_id
       └── Screen[]
            ├── parent_id
            ├── screenshot_url
            └── Hotspot[]
                 └── target_screen_id
```

## Data Models

### Projects

```typescript
interface Project {
  id: string;
  name: string;
  user_id: string | null;
  clerk_org_id: string | null;
  description: string | null;
  avatar_url: string | null;
  color: string;
  platform_type: "web" | "ios" | "android";
  is_public: boolean;
  share_token: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

### Flows

```typescript
interface Flow {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  parent_flow_id: string | null;
  parent_screen_id: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

### Screens

```typescript
interface Screen {
  id: string;
  flow_id: string;
  title: string;
  display_name: string | null;
  parent_id: string | null;
  screenshot_url: string | null;
  notes: string | null;
  order_index: number;
  level: number;
  path: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

### Hotspots

```typescript
interface Hotspot {
  id: string;
  screen_id: string;
  x_position: number; // percentage 0-100
  y_position: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  element_type: string | null;
  element_label: string | null;
  element_description: string | null;
  target_screen_id: string | null;
  interaction_type: "navigate" | "action";
  confidence_score: number | null;
  is_ai_generated: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}
```

## Success Criteria

- ✅ Users can create and organize hierarchical flow structures
- ✅ Screenshots upload successfully to Supabase Storage
- ✅ AI hotspot detection achieves >80% accuracy
- ✅ Multi-tenant isolation prevents data leaks
- ✅ Public sharing works without authentication
- ✅ Drag-and-drop reordering works smoothly

## Dependencies

- Clerk Organizations API
- Supabase PostgreSQL + Storage
- OpenAI GPT-4 Vision API
- (Optional) Python UIED service

## Security Considerations

- Row Level Security (RLS) on all tables
- JWT validation via Clerk → Supabase
- Public share tokens are randomly generated UUIDs
- File uploads validated (type, size limits)
- API routes require authentication

## Performance Requirements

- Page load time < 2s
- Screenshot upload < 5s
- AI hotspot detection < 30s
- Support 1000+ screens per project

## Related Specifications

- SPEC-002: Refactored Architecture (API Auth, Validators, Error Handling)
- SPEC-003: Testing Infrastructure
- SPEC-004: Comment System

