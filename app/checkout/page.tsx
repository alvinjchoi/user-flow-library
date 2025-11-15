"use client";

import { useEffect, Suspense, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { PricingTable } from "@clerk/nextjs";
import { BillingErrorBoundary } from "@/components/billing-error-boundary";
import { BillingSetupMessage } from "@/components/billing-setup-message";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

function CheckoutContent() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [billingDisabled, setBillingDisabled] = useState(false);

  useEffect(() => {
    document.title = "User Flow Library | Checkout";
    
    // Intercept console errors to detect billing disabled
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args: any[]) => {
      const message = args.join(" ");
      if (message.includes("billing is disabled") || message.includes("cannot_render_billing_disabled")) {
        setBillingDisabled(true);
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args: any[]) => {
      const message = args.join(" ");
      if (message.includes("billing is disabled") || message.includes("cannot_render_billing_disabled")) {
        setBillingDisabled(true);
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-center">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Select the perfect plan for your organization
          </p>
          
          <SignedOut>
            <div className="text-center space-y-4 py-12">
              <p className="text-muted-foreground mb-6">
                Please sign in to subscribe to a plan
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </div>
            </div>
          </SignedOut>
          
          <SignedIn>
            {billingDisabled ? (
              <BillingSetupMessage />
            ) : (
              <BillingErrorBoundary fallback={<BillingSetupMessage />}>
                <PricingTable 
                  for="organization"
                  onPlanSelect={(plan) => {
                    // Redirect to team selection page
                    router.push(`/checkout/select-team?plan=${plan}`);
                  }}
                />
              </BillingErrorBoundary>
            )}
          </SignedIn>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

