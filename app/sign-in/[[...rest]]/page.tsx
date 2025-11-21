"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SignIn, useOrganizationList, useAuth } from "@clerk/nextjs";

export default function SignInPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded: authLoaded, userId } = useAuth();
  const { organizationList, isLoaded: orgListLoaded, setActive } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  // Set active organization if user has one and none is active
  useEffect(() => {
    if (authLoaded && orgListLoaded && userId && organizationList && organizationList.length > 0) {
      // Find the first organization that is not null
      const firstOrg = organizationList.find(({ organization }) => organization);
      if (firstOrg?.organization) {
        // Set the first organization as active to prevent choose-organization page
        setActive({ organization: firstOrg.organization.id }).catch(console.error);
        // Redirect to dashboard
        router.replace("/dashboard");
      }
    }
  }, [authLoaded, orgListLoaded, userId, organizationList, setActive, router]);

  // Handle choose-organization redirect
  useEffect(() => {
    // If we're on the choose-organization page and user has organization, set active and redirect
    if (pathname?.includes("choose-organization") && authLoaded && orgListLoaded && userId) {
      if (organizationList && organizationList.length > 0) {
        const firstOrg = organizationList.find(({ organization }) => organization);
        if (firstOrg?.organization) {
          setActive({ organization: firstOrg.organization.id }).catch(console.error);
          router.replace("/dashboard");
        }
      }
    }
  }, [pathname, authLoaded, orgListLoaded, userId, organizationList, setActive, router]);

  // If user is signed in, show redirect message
  if (authLoaded && userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md text-center">
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>
        <SignIn 
          fallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/90",
              card: "shadow-lg border border-border",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "border border-border hover:bg-muted",
              formFieldInput: "border border-border",
              footerActionLink: "text-primary hover:text-primary/80",
            },
          }}
        />
      </div>
    </div>
  );
}
