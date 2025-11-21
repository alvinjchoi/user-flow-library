"use client";

import { useEffect, useState } from "react";
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
import { PLANS } from "@/lib/billing-constants";

// Prevent static generation - this page requires client-side auth checks
export const dynamic = "force-dynamic";

/**
 * Example: Premium content page protected by plan check
 * This page demonstrates using the has() method to check if an organization has a specific plan
 */
export default function PremiumPage() {
  const { has } = useAuth();
  const router = useRouter();
  const [hasPremiumPlan, setHasPremiumPlan] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "User Flow Library | Premium Features";

    // Check if organization has premium plan after mount
    // Plan ID: cplan_35Ux9G4lzWRWWBTmh2rxJwCVi9V
    // Note: Use the plan name/slug from Clerk Dashboard, not the plan ID
    if (has) {
      try {
        const hasPlan = has({ plan: PLANS.PREMIUM });
        setHasPremiumPlan(hasPlan);
      } catch (error) {
        console.error("Error checking premium plan:", error);
        setHasPremiumPlan(false);
      }
    } else {
      setHasPremiumPlan(false);
    }
    setIsLoading(false);
  }, [has]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!hasPremiumPlan) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Lock className="w-8 h-8 text-muted-foreground" />
                <CardTitle className="text-2xl">
                  Premium Access Required
                </CardTitle>
              </div>
              <CardDescription>
                This content is only available for organizations with a Premium
                plan subscription.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Upgrade to Premium to unlock advanced features, priority
                support, and more.
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
          <h1 className="text-3xl font-bold mb-6">Premium Features</h1>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Get detailed insights into your user flows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track user engagement, flow completion rates, and more with
                  our advanced analytics dashboard.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority Support</CardTitle>
                <CardDescription>
                  Get help when you need it most
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Premium customers receive priority support with faster
                  response times and dedicated assistance.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unlimited Projects</CardTitle>
                <CardDescription>
                  Create as many projects as you need
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No limits on the number of projects, flows, or screens you can
                  create.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Branding</CardTitle>
                <CardDescription>Make it your own</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Add your organization's branding to shared projects and
                  exports.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
