# Clerk Authentication Setup

This project uses [Clerk](https://clerk.com/) for authentication with Next.js App Router.

## ✅ What's Been Implemented

### 1. Clerk SDK Installed

- Package: `@clerk/nextjs@6.33.7`
- Installed via: `pnpm add @clerk/nextjs`

### 2. Middleware Configuration

- File: `middleware.ts`
- Uses: `clerkMiddleware()` from `@clerk/nextjs/server`
- Protects all routes except static files and Next.js internals

### 3. Root Layout Updated

- File: `app/layout.tsx`
- Wrapped app with `<ClerkProvider>`
- All Clerk hooks and components now available throughout the app

### 4. User Navigation Component

- File: `components/auth/user-nav.tsx`
- Includes:
  - `<SignInButton>` - Opens sign-in modal
  - `<SignUpButton>` - Opens sign-up modal
  - `<UserButton>` - Shows user avatar with dropdown menu
  - `<SignedIn>` / `<SignedOut>` - Conditional rendering based on auth state

## 🔑 Required Environment Variables

Create a `.env.local` file in the project root with:

```bash
# Get these from: https://dashboard.clerk.com/last-active?path=api-keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
```

### How to Get Your Clerk Keys:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application (or create a new one)
3. Navigate to **API Keys** in the sidebar
4. Copy your **Publishable Key** and **Secret Key**
5. Paste them into `.env.local`

⚠️ **Important**: Never commit `.env.local` to git. It's already in `.gitignore`.

## 🚀 Usage Examples

### Adding Auth to Your Components

```typescript
import { UserNav } from "@/components/auth/user-nav";

export function Header() {
  return (
    <header>
      <nav>
        {/* Your nav items */}
        <UserNav />
      </nav>
    </header>
  );
}
```

### Protecting Server Components

```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return <div>Protected content for user: {userId}</div>;
}
```

### Getting User Data

```typescript
import { currentUser } from "@clerk/nextjs/server";

export default async function UserProfile() {
  const user = await currentUser();

  if (!user) {
    return <div>Not signed in</div>;
  }

  return (
    <div>
      <p>Hello, {user.firstName}!</p>
      <p>Email: {user.emailAddresses[0]?.emailAddress}</p>
    </div>
  );
}
```

### Client-Side Auth State

```typescript
"use client";

import { useUser } from "@clerk/nextjs";

export function ClientComponent() {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {user.firstName}!</div>;
}
```

## 🎨 Customizing Appearance

Clerk components can be customized with the `appearance` prop:

```typescript
<UserButton
  appearance={{
    elements: {
      avatarBox: "h-8 w-8",
      userButtonPopoverCard: "bg-background border-border",
    },
  }}
/>
```

For more customization options, see [Clerk's Appearance Docs](https://clerk.com/docs/components/customization/overview).

## 📚 Additional Resources

- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Component Reference](https://clerk.com/docs/components/overview)
- [Clerk Server-Side Helpers](https://clerk.com/docs/references/nextjs/overview#server-side-helpers)
- [Protecting Routes](https://clerk.com/docs/references/nextjs/clerk-middleware)

## ⚠️ Important Notes

1. **App Router Only**: This setup uses Next.js App Router (not Pages Router)
2. **Server Components**: Use `await auth()` or `await currentUser()` from `@clerk/nextjs/server`
3. **Client Components**: Use hooks like `useUser()`, `useAuth()` from `@clerk/nextjs`
4. **Middleware**: Uses `clerkMiddleware()` (not the deprecated `authMiddleware()`)

## 🔐 Next Steps

1. Create your Clerk account at [clerk.com](https://clerk.com/)
2. Create a new application
3. Copy your API keys to `.env.local`
4. Add `<UserNav />` to your header/layout
5. Start developing!

Your users can now sign up, sign in, and manage their accounts! 🎉
