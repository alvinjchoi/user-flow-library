# 🔔 Clerk Webhook Setup - Auto-create Organization on Sign Up

## 🎯 What This Does

When a new user signs up, automatically creates a default organization named "{FirstName}'s Organization" (like Figma).

## 📋 Setup Instructions

### 1️⃣ Add Webhook Secret to Environment Variables

Add to your `.env.local`:

```bash
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

You'll get this from Clerk Dashboard in the next step.

### 2️⃣ Configure Webhook in Clerk Dashboard

#### For Development (just-bison-76):

1. Go to https://dashboard.clerk.com/
2. Select your **development instance** (`just-bison-76`)
3. Navigate to **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. Set endpoint URL:
   ```
   https://your-ngrok-url.ngrok.io/api/webhooks/clerk
   ```
   
   **Note**: For local development, use ngrok or similar:
   ```bash
   npx ngrok http 3000
   ```

6. Subscribe to events:
   - ✅ `user.created`

7. Copy the **Signing Secret** (starts with `whsec_`)
8. Add it to your `.env.local` as `CLERK_WEBHOOK_SECRET`

#### For Production (clerk.userflowlibrary.com):

1. Switch to **production instance**
2. Follow same steps, but use production URL:
   ```
   https://userflowlibrary.com/api/webhooks/clerk
   ```

### 3️⃣ Test the Webhook

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Start ngrok (in separate terminal):
   ```bash
   npx ngrok http 3000
   ```

3. Update webhook URL in Clerk with ngrok URL

4. Sign up a new test user

5. Check Clerk Dashboard → Webhooks → Your endpoint → **Logs** to see if it fired

6. Verify organization was created:
   - Sign in as the new user
   - Click OrganizationSwitcher in header
   - Should see "{FirstName}'s Organization"

## 🔍 Troubleshooting

### Webhook not firing?

1. Check Clerk Dashboard → Webhooks → Logs
2. Verify endpoint URL is correct
3. Ensure webhook secret is in `.env.local`
4. Restart dev server after adding env var

### Organization not created?

Check your terminal/console for errors:
```bash
# Should see:
✅ Created organization "John's Organization" for user user_xxxxx
```

### Test webhook manually

Use Clerk Dashboard's "Send test event" feature:
1. Go to Webhooks → Your endpoint
2. Click "Send test event"
3. Select `user.created`
4. Click "Send"

## 🎨 Customization

Edit `/app/api/webhooks/clerk/route.ts` to customize:

### Change organization name format:
```typescript
const orgName = `${first_name} ${last_name}'s Team`; // "John Doe's Team"
const orgName = `Personal Workspace`; // Fixed name
```

### Add custom slug:
```typescript
slug: `${first_name}-${id}`.toLowerCase(), // "john-user_123"
```

### Skip for certain users:
```typescript
if (email_addresses[0]?.email_address.endsWith("@test.com")) {
  return NextResponse.json({ skipped: true });
}
```

## 🚀 Production Deployment

1. Deploy your app to production (Vercel, etc.)
2. Add `CLERK_WEBHOOK_SECRET` to production environment variables
3. Update Clerk webhook endpoint URL to production domain
4. Test with a new sign up

## 📚 Resources

- [Clerk Webhooks Documentation](https://clerk.com/docs/integrations/webhooks/overview)
- [Clerk Organizations API](https://clerk.com/docs/reference/backend-api/tag/Organizations)
- [Svix Webhook Verification](https://docs.svix.com/receiving/verifying-payloads/how)

## ✅ Success Checklist

- [ ] `CLERK_WEBHOOK_SECRET` added to `.env.local`
- [ ] Webhook endpoint configured in Clerk Dashboard
- [ ] `user.created` event subscribed
- [ ] Dev server restarted
- [ ] Tested with new user sign up
- [ ] Organization appears in OrganizationSwitcher
- [ ] Production webhook configured (when deploying)

