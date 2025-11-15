"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

interface PricingPlan {
  name: string;
  badge: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: string[];
  buttonText: string;
  buttonHref?: string;
  isPopular?: boolean;
}

interface Pricing4Props {
  title?: string;
  description?: string;
  plans?: PricingPlan[];
  className?: string;
}

const Pricing4 = ({
  title = "Pricing",
  description = "Check out our affordable pricing plans.",
  plans = [
    {
      name: "Free",
      badge: "Free",
      monthlyPrice: "$0",
      yearlyPrice: "$0",
      features: [
        "Unlimited Integrations",
        "Windows, Linux, Mac support",
        "24/7 Support",
        "Free updates",
      ],
      buttonText: "Get Started",
    },
    {
      name: "Pro",
      badge: "Pro",
      monthlyPrice: "$29",
      yearlyPrice: "$249",
      features: [
        "Everything in FREE",
        "Live call suport every month",
        "Unlimited Storage",
      ],
      buttonText: "Purchase",
    },
    {
      name: "Elite",
      badge: "Elite",
      monthlyPrice: "$59",
      yearlyPrice: "$549",
      features: [
        "Everything in PRO",
        "Advanced analytics",
        "Custom branding",
        "Unlimited users",
      ],
      buttonText: "Purchase",
      isPopular: true,
    },
  ],
  className = "",
}: Pricing4Props) => {
  const [isAnnually, setIsAnnually] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  
  return (
    <section className={`py-12 md:py-20 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl mb-4">
              {title}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              {description}
            </p>
            <div className="bg-muted inline-flex h-11 items-center rounded-md p-1 mx-auto">
              <RadioGroup
                value={billingPeriod}
                onValueChange={(value) => {
                  setBillingPeriod(value);
                  setIsAnnually(value === "annually");
                }}
                className="flex gap-1"
              >
                <div className="relative">
                  <RadioGroupItem
                    value="monthly"
                    id="monthly"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="monthly"
                    className={`flex h-9 cursor-pointer items-center justify-center rounded-md px-6 text-sm font-semibold transition-all ${
                      billingPeriod === "monthly"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Monthly
                  </Label>
                </div>
                <div className="relative">
                  <RadioGroupItem
                    value="annually"
                    id="annually"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="annually"
                    className={`flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold transition-all ${
                      billingPeriod === "annually"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Yearly
                    <Badge variant="default" className="bg-primary text-primary-foreground text-xs px-2 py-0.5 h-5">
                      Save 30%
                    </Badge>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-lg border p-6 text-left transition-all hover:shadow-lg ${
                  plan.isPopular 
                    ? "bg-muted border-primary/50 ring-2 ring-primary/20" 
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Badge className="uppercase" variant={plan.isPopular ? "default" : "outline"}>
                    {plan.badge}
                  </Badge>
                  {plan.isPopular && (
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-5xl font-bold">
                    {isAnnually ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  {plan.monthlyPrice !== "$0" && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {isAnnually ? "per year" : "per month"}
                    </p>
                  )}
                </div>
                <Separator className="my-6" />
                <div className="flex flex-1 flex-col gap-6">
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-start gap-3 text-sm"
                      >
                        <Check className="size-5 shrink-0 mt-0.5 text-primary" />
                        <span className="text-foreground/90">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-auto" 
                    variant={plan.isPopular ? "default" : "outline"}
                    asChild={!!plan.buttonHref}
                  >
                    {plan.buttonHref ? (
                      <Link href={plan.buttonHref}>{plan.buttonText}</Link>
                    ) : (
                      plan.buttonText
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Pricing4 };

