"use client";

import Link from "next/link";
import { Search } from "lucide-react";

// Conditional Clerk components to prevent build errors
function ConditionalSignedIn({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try {
      const { SignedIn } = require("@clerk/nextjs");
      return <SignedIn>{children}</SignedIn>;
    } catch (error) {
      console.warn("Clerk SignedIn not available:", error);
    }
  }
  return <>{children}</>;
}

function ConditionalSignedOut({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try {
      const { SignedOut } = require("@clerk/nextjs");
      return <SignedOut>{children}</SignedOut>;
    } catch (error) {
      console.warn("Clerk SignedOut not available:", error);
    }
  }
  return null;
}

function ConditionalUserNav() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try {
      const { UserNav } = require("@/components/auth/user-nav");
      return <UserNav />;
    } catch (error) {
      console.warn("UserNav not available:", error);
    }
  }
  return null;
}

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">User Flow Organizer</span>
        </Link>
        <nav className="flex items-center gap-6">
          <ConditionalSignedIn>
            <Link
              href="/"
              className="text-sm hover:text-primary transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/admin/upload"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Admin
            </Link>
          </ConditionalSignedIn>
          <ConditionalSignedOut>
            <Link
              href="/"
              className="text-sm hover:text-primary transition-colors"
            >
              Home
            </Link>
          </ConditionalSignedOut>
          <ConditionalUserNav />
        </nav>
      </div>
    </header>
  );
}
