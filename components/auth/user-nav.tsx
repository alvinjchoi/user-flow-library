"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserNav() {
  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton fallbackRedirectUrl="/dashboard" signInFallbackRedirectUrl="/dashboard">
          <Button size="sm">Sign Up</Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox:
                "h-10 w-10 border-2 border-border hover:border-primary transition-colors",
              userButtonPopoverCard:
                "bg-background border border-border shadow-lg",
              userButtonPopoverActionButton: "hover:bg-muted",
              userButtonPopoverActionButtonText: "text-foreground",
              userButtonPopoverFooter: "hidden",
            },
          }}
          userProfileUrl="/user-profile"
        >
          <UserButton.MenuItems>
            <UserButton.Link
              label="Manage team"
              labelIcon={<Users className="h-4 w-4" />}
              href="/organization"
            />
          </UserButton.MenuItems>
        </UserButton>
      </SignedIn>
    </div>
  );
}
