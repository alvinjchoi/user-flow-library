# User Flow Library

A Mobbin-style web application for organizing and documenting user flow screenshots. Create projects, manage flows, annotate screens, and export professional PDF documentation—all with AI-assisted hotspot detection for interactive prototypes.

## ✨ Features

- **📱 Multi-Platform Support** - Organize flows for Web, iOS, and Android projects with platform-specific dimensions
- **🌳 Hierarchical Organization** - Structure your work as Projects → Flows → Screens with nested sub-flows
- **💬 Figma-Style Comments** - Add positional annotations with threading and resolution tracking
- **🎯 AI Hotspot Detection** - Automatically detect interactive UI elements using GPT-4 Vision or UIED
- **🔗 Interactive Prototypes** - Link screens together to create clickable prototypes
- **📄 PDF Export** - Generate professional flow documentation with Typst compiler
- **🔐 Secure Sharing** - Share projects via public links with read-only access
- **👥 Team Collaboration** - Organization support with Clerk authentication and RLS policies
- **🎨 Modern UI** - Built with Next.js 15, Tailwind CSS v4, and shadcn/ui components

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- [Supabase](https://supabase.com) account (database & storage)
- [Clerk](https://clerk.com) account (authentication)
- Optional: OpenAI API key for AI features

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd user-flow-library
   pnpm install
   ```

2. **Set up environment variables**
   
   Create `.env.local` with your keys:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   CLERK_WEBHOOK_SECRET=whsec_...
   OPENAI_API_KEY=sk-...  # Optional for AI features
   ```
   
   See [Environment variables](docs/reference/environment-variables.md) for details.

3. **Set up database**
   
   Run the SQL migrations in your Supabase dashboard:
   - Execute `sql/reference/CREATE_FLOW_TABLES.sql`
   - Follow `sql/reference/migration-guide.md` for complete setup

4. **Configure Clerk**
   
   Set up JWT template and webhooks:
   - [Clerk webhook setup guide](docs/how-to/clerk-webhook-setup.md)
   - [Clerk + Supabase integration](docs/CLERK_SUPABASE_JWT_SETUP.md)

5. **Start development server**
   ```bash
   pnpm dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

### Tutorials
- [Local development walkthrough](docs/tutorials/local-development.md) - Complete setup guide

### How-To Guides
- [Set up Clerk webhooks](docs/how-to/clerk-webhook-setup.md) - Auto-create organizations
- [Security update checklist](docs/how-to/security-update-guide.md) - RLS policies and security
- [UIED deployment options](docs/how-to/uied-deployment-options.md) - Advanced AI detection

### Reference
- [Environment variables](docs/reference/environment-variables.md) - All configuration options
- [Platform type feature](docs/reference/PLATFORM_TYPE_FEATURE.md) - Web/iOS/Android support
- [Migration guide](sql/reference/migration-guide.md) - Database schema setup

### Explanations
- [Commenting feature](docs/explanation/commenting-feature.md) - Figma-style annotations
- [Hotspot detection](docs/explanation/hotspot-detection-improvements.md) - AI-powered UI detection
- [Interactive prototypes](docs/explanation/interactive-prototype-plan.md) - Clickable flows
- [UIED integration](docs/explanation/uied-integration-plan.md) - Advanced detection system

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
hooks/           Custom React hooks for data and actions
python-service/  Optional UIED detection microservice
sql/             Schema and policy scripts for Supabase
.speckit/        Spec-Driven Development specifications
```

## Development Commands

```bash
pnpm run dev            # Start dev server
pnpm run build          # Run tests + build for production
pnpm run lint           # Run ESLint
pnpm test               # Run test suite
pnpm test:watch         # Run tests in watch mode
pnpm test:coverage      # Generate coverage report
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

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables (see [Environment variables](docs/reference/environment-variables.md))
4. Deploy!

**Required Environment Variables:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLERK_WEBHOOK_SECRET`

**Optional for AI Features:**
- `OPENAI_API_KEY` - For GPT-4 Vision hotspot detection
- `UIED_SERVICE_URL` - For advanced UIED detection (Railway/Render)

### PDF Export Feature

For PDF export functionality, ensure Typst compiler is installed on your server:
```bash
# On your hosting platform
apt-get install typst
```
Or deploy to a platform that supports custom dependencies.

## Spec-Driven Development

This project uses [Spec Kit](https://github.github.com/spec-kit/) for Spec-Driven Development:

- **Specifications:** `.speckit/specs/` - Feature requirements and architecture docs
- **Plans:** `.speckit/plans/` - Technical implementation plans
- **Tasks:** `.speckit/tasks/` - Tracked development tasks
- **Guide:** [.speckit/SPECKIT_GUIDE.md](.speckit/SPECKIT_GUIDE.md)

See [.speckit/INDEX.md](.speckit/INDEX.md) for all specifications.

## Testing

Comprehensive test suite with Jest and React Testing Library:

```bash
pnpm test              # Run all tests
pnpm test:coverage     # View coverage report
```

Tests run automatically before every production build. See [TESTING.md](TESTING.md) for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Code of conduct
- Development setup
- Pull request process
- Code style guidelines

## 🔒 Security

Found a security vulnerability? Please see our [Security Policy](SECURITY.md) for responsible disclosure guidelines.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/), [Supabase](https://supabase.com), and [Clerk](https://clerk.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- PDF generation with [Typst](https://typst.app)
- Inspired by [Mobbin](https://mobbin.com)
