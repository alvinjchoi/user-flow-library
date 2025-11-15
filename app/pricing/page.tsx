"use client";

import { useEffect } from "react";
import { Header } from "@/components/header";
import { Pricing4 } from "@/components/sections/pricing/pricing4";

export default function PricingPage() {
  useEffect(() => {
    document.title = "User Flow Library | Pricing";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Pricing4
          title="Choose Your Plan"
          description="Select the perfect plan for your organization"
          plans={[
            {
              name: "Starter",
              badge: "Starter",
              monthlyPrice: "$0",
              yearlyPrice: "$0",
              features: [
                "Up to 1 user",
                "Up to 3 projects",
                "Basic organization",
                "Public sharing",
                "Community support",
              ],
              buttonText: "Get Started",
              buttonHref: "/sign-up",
            },
            {
              name: "Basic",
              badge: "Basic",
              monthlyPrice: "$29",
              yearlyPrice: "$244",
              features: [
                "Unlimited users",
                "Everything in Starter",
                "Unlimited projects",
                "Team collaboration",
                "Advanced organization",
                "Priority support",
                "PDF export",
              ],
              buttonText: "Get Started",
              buttonHref: "/pricing",
              isPopular: true,
            },
          ]}
        />
      </main>
    </div>
  );
}
