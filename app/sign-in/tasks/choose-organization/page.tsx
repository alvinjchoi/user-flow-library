"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useOrganizationList } from "@clerk/nextjs";

export default function ChooseOrganizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded: authLoaded, userId } = useAuth();
  const {
    organizationList,
    isLoaded: orgListLoaded,
    setActive,
  } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  useEffect(() => {
    if (!authLoaded || !orgListLoaded) {
      return;
    }

    // If user is not signed in, redirect to sign-in
    if (!userId) {
      const fallbackUrl = searchParams.get("sign_in_fallback_redirect_url") || "/dashboard";
      router.replace(`/sign-in?redirect_url=${encodeURIComponent(fallbackUrl)}`);
      return;
    }

    // If user has organizations, set the first one as active and redirect
    if (organizationList && organizationList.length > 0) {
      const firstOrg = organizationList.find(
        ({ organization }) => organization
      );
      
      if (firstOrg?.organization) {
        // Set the first organization as active
        setActive({ organization: firstOrg.organization.id })
          .then(() => {
            // Get redirect URL from query params or default to dashboard
            const redirectUrl =
              searchParams.get("sign_in_fallback_redirect_url") ||
              searchParams.get("sign_up_fallback_redirect_url") ||
              "/dashboard";
            router.replace(redirectUrl);
          })
          .catch((error) => {
            console.error("Error setting active organization:", error);
            // Still redirect even if setActive fails
            const redirectUrl =
              searchParams.get("sign_in_fallback_redirect_url") ||
              searchParams.get("sign_up_fallback_redirect_url") ||
              "/dashboard";
            router.replace(redirectUrl);
          });
      } else {
        // No valid organization found, redirect to dashboard
        const redirectUrl =
          searchParams.get("sign_in_fallback_redirect_url") ||
          searchParams.get("sign_up_fallback_redirect_url") ||
          "/dashboard";
        router.replace(redirectUrl);
      }
    } else {
      // User has no organizations, redirect to dashboard
      const redirectUrl =
        searchParams.get("sign_in_fallback_redirect_url") ||
        searchParams.get("sign_up_fallback_redirect_url") ||
        "/dashboard";
      router.replace(redirectUrl);
    }
  }, [
    authLoaded,
    orgListLoaded,
    userId,
    organizationList,
    setActive,
    router,
    searchParams,
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md text-center">
        <p className="text-muted-foreground">Setting up your organization...</p>
      </div>
    </div>
  );
}

