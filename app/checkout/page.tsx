"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { PricingTable } from "@clerk/nextjs";
import { BillingErrorBoundary } from "@/components/billing-error-boundary";
import { BillingSetupMessage } from "@/components/billing-setup-message";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");

  useEffect(() => {
    document.title = "User Flow Library | Checkout";
  }, []);

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
          <BillingErrorBoundary fallback={<BillingSetupMessage />}>
            <PricingTable for="organization" />
          </BillingErrorBoundary>
        </div>
      </main>
    </div>
  );
}

