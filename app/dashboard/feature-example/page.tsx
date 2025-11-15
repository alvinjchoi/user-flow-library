"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock } from "lucide-react";
import Link from "next/link";
import { FEATURES } from "@/lib/billing-constants";

/**
 * Example: Feature-gated content page
 * This page demonstrates using the has() method to check if an organization has a specific feature
 */
export default function FeatureExamplePage() {
  const { has } = useAuth();
  const router = useRouter();

  useEffect(() => {
    document.title = "User Flow Library | Advanced Features";
  }, []);

  // Check if organization has a specific feature
  const hasAdvancedAnalytics = has({ feature: FEATURES.ADVANCED_ANALYTICS });

  if (!hasAdvancedAnalytics) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Lock className="w-8 h-8 text-muted-foreground" />
                <CardTitle className="text-2xl">
                  Feature Not Available
                </CardTitle>
              </div>
              <CardDescription>
                This feature requires a plan that includes the Advanced
                Analytics feature.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Upgrade your plan to unlock this feature and more.
              </p>
              <div className="flex gap-4">
                <Button asChild>
                  <Link href="/pricing">View Plans</Link>
                </Button>
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Advanced Analytics</h1>

          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                View detailed analytics for your user flows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This is an example of content that's only available to
                organizations with the Advanced Analytics feature enabled.
              </p>
              <div className="space-y-2">
                <p>• Flow completion rates</p>
                <p>• User engagement metrics</p>
                <p>• Export analytics reports</p>
                <p>• Custom date ranges</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
