# Environment Variables

## Required for All Environments

### Clerk (Authentication)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

### Supabase (Database & Storage)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # For server-side operations & webhooks
```

### Clerk Webhook (For auto-organization creation)
```bash
CLERK_WEBHOOK_SECRET=whsec_...
```

## Optional Features

### OpenAI (AI-Powered Features) - **Optional**
```bash
OPENAI_API_KEY=sk-...
```

**What it enables:**
- `/tools/ui-detector` - Automatic UI component detection from screenshots
- `/api/analyze-screenshot` - AI-powered screenshot analysis
- `/api/ui-component-detect` - GPT-4 Vision for detecting UI elements

**If not configured:**
- App works normally ✅
- UI detector page shows: "OpenAI API key not configured"
- These features are not critical for core functionality

---

## Environment Setup by Deployment

### Local Development (`.env.local`)
```bash
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CLERK_WEBHOOK_SECRET=whsec_...

# Optional
OPENAI_API_KEY=sk-...
```

### Production (Vercel Environment Variables)
```bash
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CLERK_WEBHOOK_SECRET=whsec_...

# Optional (omit if not needed)
# OPENAI_API_KEY=sk-...
```

---

## Vercel Deployment

1. **Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

2. **Add each variable:**
   - Variable Name: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Value: `pk_live_...`
   - Environment: Production, Preview, Development

3. **Important:**
   - All `NEXT_PUBLIC_*` variables are exposed to the browser
   - Secret keys (CLERK_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY) are server-only
   - Redeploy after adding/changing variables

---

## Security Notes

### ✅ Safe to expose (browser)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 🔒 Server-only (never expose)
- `CLERK_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLERK_WEBHOOK_SECRET`
- `OPENAI_API_KEY`

---

## Clerk Setup

### Development Instance
- URL: `https://your-dev-instance.clerk.accounts.dev`
- JWT Template: `supabase` (for RLS)
- Organizations: Enabled

### Production Instance  
- URL: `https://clerk.your-domain.com` (or use default Clerk domain)
- JWT Template: `supabase` (for RLS)
- Organizations: Enabled
- OAuth Providers: Configure as needed (Google, GitHub, etc.)

---

## Troubleshooting

### "OpenAI API key not configured"
- **Expected** if OPENAI_API_KEY is not set
- Optional feature - app works without it
- Add key only if you need AI-powered screenshot analysis

### "Unauthorized" on API requests
- Check CLERK_SECRET_KEY is set correctly
- Ensure JWT template is configured in Clerk
- Verify Supabase RLS policies match JWT claims

### Webhook errors
- Verify CLERK_WEBHOOK_SECRET matches Clerk Dashboard
- Check webhook URL is publicly accessible
- For local development, use ngrok or Svix Play

---

## Quick Reference

| Feature | Required Env Vars |
|---------|-------------------|
| Authentication | CLERK keys |
| Database | SUPABASE keys |
| Auto-org creation | CLERK_WEBHOOK_SECRET |
| AI screenshot analysis | OPENAI_API_KEY (optional) |

