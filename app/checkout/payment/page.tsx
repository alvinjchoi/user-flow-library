"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";

function PaymentContent() {
  const { isLoaded, userId } = useAuth();
  const { organization } = useOrganization();
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "starter";
  const orgId = searchParams.get("orgId");
  
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");
  const [licenses, setLicenses] = useState(3);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [country, setCountry] = useState("United States");
  const [postalCode, setPostalCode] = useState("90210");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  // Plan pricing (example - should match your Clerk plans)
  const planPricing = {
    starter: {
      monthly: 8,
      yearly: 8, // per month when billed yearly
    },
    basic: {
      monthly: 29,
      yearly: 24, // per month when billed yearly
    },
  };

  const currentPlan = planPricing[plan as keyof typeof planPricing] || planPricing.starter;
  const monthlyPrice = billingPeriod === "yearly" ? currentPlan.yearly : currentPlan.monthly;
  const totalPrice = monthlyPrice * licenses * (billingPeriod === "yearly" ? 12 : 1);
  const savings = billingPeriod === "yearly" ? ((currentPlan.monthly - currentPlan.yearly) * licenses * 12) : 0;

  useEffect(() => {
    document.title = `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan: Payment details`;
  }, [plan]);

  const handleReviewOrder = () => {
    // TODO: Integrate with Clerk billing API to create subscription
    console.log("Review order:", {
      plan,
      orgId,
      billingPeriod,
      licenses,
      totalPrice,
    });
    // For now, just show an alert
    alert("Checkout integration with Clerk billing API needed");
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column - Payment details */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-6">
                  {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan: Payment details
                </h1>
              </div>

              {/* Licenses */}
              <div className="space-y-2">
                <Label htmlFor="licenses">Licenses</Label>
                <select
                  id="licenses"
                  value={licenses}
                  onChange={(e) => setLicenses(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "member" : "members"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Billing period */}
              <div className="space-y-3">
                <Label>Billing period</Label>
                <RadioGroup
                  value={billingPeriod}
                  onValueChange={(value) => setBillingPeriod(value as "monthly" | "yearly")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yearly" id="yearly" />
                    <Label htmlFor="yearly" className="flex items-center gap-2 cursor-pointer">
                      Yearly
                      <Badge variant="default" className="bg-yellow-500 text-yellow-900">
                        Save 20%
                      </Badge>
                      <span className="text-muted-foreground">
                        ${currentPlan.yearly}/month
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="cursor-pointer">
                      Monthly
                      <span className="text-muted-foreground ml-2">
                        ${currentPlan.monthly}/month
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Payment method */}
              <div className="space-y-3">
                <Label>Choose payment method</Label>
                <div className="flex gap-4">
                  <Card className="border-primary border-2 cursor-pointer">
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                      <CreditCard className="w-8 h-8 text-primary" />
                      <span className="text-sm font-medium">Card</span>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Card details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 1234 1234 1234"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Powered by Stripe</span>
                    <div className="flex gap-1">
                      <span>VISA</span>
                      <span>MC</span>
                      <span>AMEX</span>
                      <span>Discover</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiration date</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">Security code</Label>
                    <Input
                      id="cvc"
                      placeholder="CVC"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>

              {/* Billing address */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country*</Label>
                    <select
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code*</Label>
                    <Input
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Company information */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Company information (optional)</Label>
                <Input
                  id="companyName"
                  placeholder="Company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This information will be displayed on your invoice and
                </p>
              </div>
            </div>

            {/* Right column - Order summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Prices are in USD</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        ${monthlyPrice} x {licenses} {licenses === 1 ? "member" : "members"} x {billingPeriod === "yearly" ? "1 year" : "1 month"}
                      </span>
                      <span className="font-semibold">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>

                  <Link
                    href="#"
                    className="text-sm text-primary hover:underline block"
                  >
                    Have a promo code?
                  </Link>

                  <Button
                    className="w-full"
                    onClick={handleReviewOrder}
                    disabled={loading || !cardNumber || !expiryDate || !cvc}
                  >
                    Review order
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    You'll be charged ${totalPrice.toFixed(2)} {billingPeriod === "yearly" ? "yearly" : "monthly"} until you cancel the subscription. To learn more see{" "}
                    <Link href="/faq" className="text-primary hover:underline">
                      FAQ
                    </Link>
                    .
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">Loading...</p>
        </main>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}

