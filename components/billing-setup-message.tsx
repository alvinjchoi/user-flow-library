"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Settings } from "lucide-react";
import Link from "next/link";

export function BillingSetupMessage() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-muted-foreground" />
          <CardTitle className="text-2xl">Billing Setup Required</CardTitle>
        </div>
        <CardDescription>
          Billing needs to be enabled in your Clerk Dashboard before you can
          display pricing plans.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          To enable billing and start accepting subscriptions:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
          <li>Navigate to the Clerk Dashboard</li>
          <li>Go to Billing Settings</li>
          <li>Follow the setup wizard to enable billing</li>
          <li>Create your subscription plans</li>
          <li>Return here to see your pricing table</li>
        </ol>
        <div className="flex gap-4 pt-4">
          <Button asChild>
            <a
              href="https://dashboard.clerk.com/last-active?path=billing/settings"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Clerk Dashboard
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> For development, you can use Clerk's
            development gateway (no Stripe account needed). For production,
            you'll need to connect your own Stripe account.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

