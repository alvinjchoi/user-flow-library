"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function UserNav() {
  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
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
        />
      </SignedIn>
    </div>
  );
}
