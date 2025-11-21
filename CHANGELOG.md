# v1.1.0 - Pricing & Mermaid Editor

## Release Date
November 21, 2024

## Major Features

### Pricing & Billing System
- feat: add complete pricing page with Starter (free) and Basic ($29/month) plans: #4c1fb2a
- feat: integrate Clerk billing with Stripe for payment processing: #4c1fb2a
- feat: implement sign-up flow with plan selection: #4c1fb2a
- feat: add team creation flow during sign-up: #4c1fb2a
- feat: dynamic landing page CTAs based on authentication state: #4c1fb2a
- fix: improve authentication redirects and error handling: #4c1fb2a

### Mermaid Flowchart Editor
- feat: add Mermaid flowchart editor with nearly fullscreen layout (98vw x 98vh): #4de6c77
- feat: implement real-time Mermaid script validation and rendering: #4de6c77
- feat: add advanced zoom controls (mouse wheel, pinch-to-zoom, zoom buttons): #4de6c77
- feat: add pan functionality with click-and-drag navigation: #4de6c77
- feat: render SVG at 20x scale for crisp readability: #4de6c77
- feat: add database support with mermaid_script column in flows table: #4de6c77
- feat: add API functions for saving/retrieving Mermaid scripts: #4de6c77

### Documentation & Maintenance
- docs: add app screenshot to README for better visibility: #ad72b18
- docs: update project description in README: #39b9c5a
- chore: remove Mobbin references except from README: #69e973d
- chore: add gitignore for Supabase temporary files: #e122a41
- chore: skip remote schema migration to prevent re-application: #e122a41

### Database Changes
- migration: add mermaid_script TEXT column to flows table
- migration: add index for faster lookups of flows with mermaid scripts

## Pull Requests
- #17 feat: Add Mermaid flowchart editor with zoom and pan controls
- #16 feat: Add pricing page and improve sign-up flow
- #13 docs: add app screenshot to README

---

# v1.0.0 - Public Release

## Core Changes

### Security & Public Release
- chore: prepare repository for public release: #51edcf5
- chore: clean up unnecessary root directory files: #45ceeff
- docs: enhance README with comprehensive feature list and setup guide: #c4ff1b6
- fix: remove all personal identifiers from documentation: #51edcf5
- fix: replace production IDs with placeholders in SQL scripts: #51edcf5
- security: enhance .gitignore to prevent future exposure: #51edcf5

### Documentation
- docs: add LICENSE (MIT): #51edcf5
- docs: add SECURITY.md with vulnerability reporting: #51edcf5
- docs: add CONTRIBUTING.md for open source contributors: #51edcf5
- docs: update package.json name to 'user-flow-library': #c4ff1b6
- docs: add Quick Start guide with prerequisites: #c4ff1b6
- docs: add deployment guide for Vercel: #c4ff1b6

### Testing Infrastructure
- test: add comprehensive test suite with pre-build validation: #6b228d7
- test: add Jest and React Testing Library setup: #6b228d7
- test: add API validators and error utilities: #6b228d7
- test: add coverage reporting: #6b228d7
- feat: add TESTING.md guide: #c80f14c

### Code Quality
- refactor: apply unified error handling to API routes: #b9375d6
- refactor: add unified error handling and custom hooks: #c8da6f9
- refactor: update API routes and components to use shared utilities: #b9bc8c3
- refactor: add shared utility modules for DRY improvements: #48df236
- feat: add custom React hooks (useProjectData, useScreenActions): #c80f14c
- feat: add Spec Kit infrastructure for Spec-Driven Development: #d9d4009

### Platform Features
- feat(db): add platform_type column to projects table: #640ee0f
- feat(types): add platform_type to Project interface: #9bf2a3e
- feat(ui): add platform selection dialog for new projects: #8fc1e79
- feat(projects): integrate platform type selection in project creation: #3508615
- feat(ui): implement platform-aware screen dimensions: #cd26c74
- docs: add platform type feature documentation: #87f05cf

### PDF Export
- feat: add PDF export functionality for user flows: #954b7ec
- feat: implement Typst compiler integration: #954b7ec
- feat: add landscape-oriented PDF with table of contents: #954b7ec
- feat: add screenshot gallery in PDF with titles and descriptions: #954b7ec

### AI & Hotspot Detection
- feat: Integrate UIED for precise UI element detection: #cd83198
- feat: integrate ScreenCoder layout detection into hotspot editor: #ac2961f
- feat: properly integrate ScreenCoder's block parsing + HTML generation: #7a8c0f9
- feat: fix ScreenCoder integration with flexible label parsing: #4bcfe15
- feat: improve ScreenCoder to detect component-level elements: #be8dae4
- feat: add explicit Draw Mode button for manual hotspot creation: #b718a6f
- feat: add delete button to hotspot list items: #4d5b226
- feat: add back button to Edit Hotspot panel: #d8e03a8
- feat: add layout generation endpoint with GPT-4 Vision: #892c874
- feat: clone UIED during Docker build for Render deployment: #a560d6b
- feat: add render.yaml for UIED service deployment: #2cc82b5
- fix: Increase UIED detection timeout to 2 minutes: #2a44afd
- fix: improve bounding box accuracy with tighter detection: #600a7df
- fix: handle OCR-less detection in UIED (avoid NoneType error): #9dd7fea
- fix: patch UIED for Python 3.10+ compatibility (time.clock removal): #7f7e920
- fix: add ScreenCoder dependencies (beautifulsoup4, google-generativeai): #bddef0e

### Collaboration Features
- feat: Add Figma-style commenting system with read-only shared links: #18200e7
- feat: Add comment resolution tracking and fix resolve permissions: #c8c57ea
- feat(comments): add resolution tracking with timestamp and user: #15b06e2
- feat: auto-create default organization on user sign up: #7651c0d
- feat: hide personal account option (organization-only mode): #e8a068e
- feat: add Manage team menu item and org assignment tools: #569d4a5
- feat: move OrganizationSwitcher to logo position: #bcecb3a
- feat: hide org switcher and dashboard link on project pages: #9c093e7

### API & Infrastructure
- feat: Create API routes for flows and screens with admin access: #d728d04
- fix: resolve project access race and add debug resources: #65fb000
- fix: handle isDynamicRSC condition when deployed: #85919
- docs: add guide for fixing clerk_org_id access issues: #640fc6a

### UI/UX Improvements
- feat: add Download button to screen viewer overlay: #8c2ea69
- feat: add drag and drop to reorder screens in gallery view: #d112913
- feat: remove prototype player (Play button): #76303ff
- fix: add close button to hotspot editor: #d14048e

### Core Functionality
- feat: add core UI components: #7b53dfc
- feat: transform homepage and add project detail pages: #dfc5c26
- feat: add ability to create flows branching from screens: #5c23e6b
- feat: add proper dialog for screen creation with parent selection: #5c994a9
- feat: display child screens with visual branching indicators: #816419c
- feat: add delete functionality for screens and flows: #dfbb797
- fix: add new screens to end of list instead of 2nd position: #279a69f
- fix: restore grid layout and fix scrolling: #e0a2fa4
- fix: remove conflicting overflow from gallery to enable scrolling: #d3eabcf
- fix: add min-h-0 for proper flexbox scrolling: #6c5ad77

### Performance
- perf: implement optimistic updates for screen edits: #c65e6c0
- perf: optimize screenshot upload without page reload: #bed1d3c
- fix: remove noisy storage warnings and add image sizes: #daf67fc
- fix: remove noisy storage bucket check warnings: #b02b98b

### Database & Infrastructure
- feat: add Supabase client setup and database schema: #35c028a
- feat: add data layer with CRUD operations: #79316ad
- refactor: update pattern components for Supabase: #2c742b8
- chore: update configuration and documentation: #d1ed1e3

## Misc Changes

### Repository Management
- chore: sync main changes to v0-pattern-library: #e1d90c9
- chore: sync dev to main with UIED integration: #9ad1705
- chore: Force redeploy - add timestamp comment: #70165af
- Merge dev into main: PDF export and platform type features: #76e0d56
- Merge feat/platform-type-selection into dev: #b17e49f
- Merge branch 'feat/uied-integration' into dev: #a05db2d
- Merge branch 'feat/uied-integration': #30dbc37
- Merge branch 'dev': #396f0ab
- Merge branch 'main' into dev: #cd550b1
- Merge branch 'main' of https://github.com/alvinjchoi/user-flow-library: #3835f9d

### Testing
- debug: add detailed logging for hotspot creation errors: #f8fd6dd
- debug: add comprehensive logging to hotspot editor: #13e5a62

### Deployment
- feat: Add deployment guide and improve hotspot editor UX: #8cdef46

### Initial Setup
- Initialized repository for project Patterns library: #3f544c9

## Credits

Huge thanks to @alvinjchoi for building and open sourcing this project!

Special thanks to the open source community and tools that made this possible:
- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- Clerk for authentication
- shadcn/ui for beautiful components
- OpenAI for GPT-4 Vision integration
- The UIED and ScreenCoder projects for AI detection capabilities

## Contributors

@alvinjchoi

