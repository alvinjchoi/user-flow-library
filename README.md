# User Flow Library

User Flow Library is a Mobbin-style interface for organising projects, flows, and screens in a hierarchical tree with AI-assisted hotspot detection.

## Tutorials

- [Local development walkthrough](docs/tutorials/local-development.md) – start the app against the managed Supabase project.

## How-To Guides

- [Set up Clerk webhooks](docs/how-to/clerk-webhook-setup.md)
- [Apply the security update checklist](docs/how-to/security-update-guide.md)

## Reference

- [Environment variables](docs/reference/environment-variables.md)
- [Pull request description template](docs/reference/pr-description.md)
- SQL migrations live in `sql/`, with `sql/README_MIGRATIONS.md` describing execution order.

## Explanations

- [Commenting feature design](docs/explanation/commenting-feature.md)
- [Hotspot detection improvements](docs/explanation/hotspot-detection-improvements.md)
- [Interactive prototype plan](docs/explanation/interactive-prototype-plan.md)
- [UIED integration plan](docs/explanation/uied-integration-plan.md)

## Architecture at a Glance

- **Frontend**: Next.js 15 App Router with TypeScript, Tailwind CSS v4, shadcn/ui, and Clerk for auth.
- **Backend**: Supabase (Postgres + Storage) with SQL scripts for schema and storage policies.
- **AI services**: GPT-4 Vision integration by default, optional Python FastAPI UIED service (`python-service/`).

### Domain model

```
Project → Flow → Screen
```

Screens can be nested to represent sub-steps inside a flow.

### Key directories

```
app/             Next.js routes and API handlers
components/      UI building blocks grouped by domain
lib/             Supabase client utilities and CRUD helpers
python-service/  Optional UIED detection microservice
sql/             Schema and policy scripts for Supabase
```

## Development Commands

```bash
pnpm run dev      # Start dev server
pnpm run build    # Build for production
pnpm run lint     # Run ESLint
```

## AI Detection (Optional)

The app supports **hybrid AI detection** for interactive UI elements:

### Quick Start: GPT-4 Vision
```bash
OPENAI_API_KEY=sk-your-key-here
```

### Advanced: UIED + GPT-4 (Higher Accuracy)
Deploy UIED separately (Railway/Render) and configure:
```bash
UIED_SERVICE_URL=https://your-railway-app.up.railway.app
```

**📖 Full guide:** [docs/how-to/uied-deployment-options.md](docs/how-to/uied-deployment-options.md)

## Deployment Notes

Deploy to Vercel (or similar) with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Provide `OPENAI_API_KEY` or `UIED_SERVICE_URL` if hotspots are required.

## Licensing

MIT
