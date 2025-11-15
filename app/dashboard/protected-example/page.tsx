"use client";

import { useEffect } from "react";
import { Protect } from "@clerk/nextjs";
import { Header } from "@/components/header";
import { PLANS, FEATURES, PERMISSIONS } from "@/lib/billing-constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Example: Using the Protect component to gate content
 * This page demonstrates using the <Protect> component to conditionally render content
 * based on plan, feature, or permission
 */
export default function ProtectedExamplePage() {
  useEffect(() => {
    document.title = "User Flow Library | Protected Content";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">
            Protected Content Examples
          </h1>

          <div className="space-y-6">
            {/* Example 1: Protect by Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Plan-Based Protection</CardTitle>
                <CardDescription>
                  This content is only visible to organizations with a "premium"
                  plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Protect
                  plan={PLANS.PREMIUM}
                  fallback={
                    <p className="text-muted-foreground">
                      This content requires a Premium plan.{" "}
                      <a href="/pricing" className="text-primary underline">
                        Upgrade now
                      </a>
                      .
                    </p>
                  }
                >
                  <div className="space-y-2">
                    <p className="font-semibold">
                      🎉 Premium Content Unlocked!
                    </p>
                    <p className="text-muted-foreground">
                      This content is only visible to organizations subscribed
                      to the Premium plan.
                    </p>
                  </div>
                </Protect>
              </CardContent>
            </Card>

            {/* Example 2: Protect by Feature */}
            <Card>
              <CardHeader>
                <CardTitle>Feature-Based Protection</CardTitle>
                <CardDescription>
                  This content is only visible to organizations with the
                  "advanced_analytics" feature
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Protect
                  feature={FEATURES.ADVANCED_ANALYTICS}
                  fallback={
                    <p className="text-muted-foreground">
                      This feature requires the Advanced Analytics feature.{" "}
                      <a href="/pricing" className="text-primary underline">
                        View plans
                      </a>
                      .
                    </p>
                  }
                >
                  <div className="space-y-2">
                    <p className="font-semibold">
                      📊 Advanced Analytics Enabled!
                    </p>
                    <p className="text-muted-foreground">
                      This content is only visible to organizations with the
                      Advanced Analytics feature.
                    </p>
                  </div>
                </Protect>
              </CardContent>
            </Card>

            {/* Example 3: Protect by Permission */}
            <Card>
              <CardHeader>
                <CardTitle>Permission-Based Protection</CardTitle>
                <CardDescription>
                  This content is only visible to users with the
                  "org:premium_access:manage" permission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Protect
                  permission={PERMISSIONS.PREMIUM_ACCESS_MANAGE}
                  fallback={
                    <p className="text-muted-foreground">
                      You don't have permission to view this content. Contact
                      your organization administrator.
                    </p>
                  }
                >
                  <div className="space-y-2">
                    <p className="font-semibold">🔐 Admin Content</p>
                    <p className="text-muted-foreground">
                      This content is only visible to users with the
                      premium_access:manage permission.
                    </p>
                  </div>
                </Protect>
              </CardContent>
            </Card>

            {/* Example 4: Multiple Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Multiple Conditions</CardTitle>
                <CardDescription>
                  This content requires both a plan AND a feature
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Protect
                  plan={PLANS.PREMIUM}
                  feature={FEATURES.ADVANCED_ANALYTICS}
                  fallback={
                    <p className="text-muted-foreground">
                      This content requires both Premium plan and Advanced
                      Analytics feature.
                    </p>
                  }
                >
                  <div className="space-y-2">
                    <p className="font-semibold">✨ Exclusive Content</p>
                    <p className="text-muted-foreground">
                      This content is only available to Premium subscribers with
                      Advanced Analytics enabled.
                    </p>
                  </div>
                </Protect>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
