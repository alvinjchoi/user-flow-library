"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { CreateTeamModal } from "@/components/checkout/create-team-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PlanType = "free" | "basic" | null;

export default function SignUpPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);

  const handlePlanSelection = (plan: PlanType) => {
    setSelectedPlan(plan);
  };

  const getRedirectUrl = () => {
    if (selectedPlan === "free") {
      return "/dashboard";
    } else if (selectedPlan === "basic") {
      // Store plan in sessionStorage to check after sign up
      if (typeof window !== "undefined") {
        sessionStorage.setItem("selectedPlan", "basic");
      }
      return "/dashboard";
    }
    return "/dashboard";
  };

  const handleTeamCreated = async (teamName: string) => {
    setShowTeamModal(false);
    
    // Create organization via API
    try {
      const response = await fetch("/api/organizations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: teamName }),
      });

      if (response.ok) {
        // Redirect to dashboard with plan selection overlay
        router.push("/dashboard?showPlanSelection=true&plan=basic");
      } else {
        console.error("Failed to create organization");
        router.push("/dashboard?showPlanSelection=true&plan=basic");
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      router.push("/dashboard?showPlanSelection=true&plan=basic");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12">
      <div className="w-full max-w-2xl px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-muted-foreground">
            Get started with your free account today
          </p>
        </div>

        {/* Plan Selection */}
        {!selectedPlan ? (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* Free Plan */}
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handlePlanSelection("free")}
            >
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="text-2xl font-bold mt-2">$0</div>
                <p className="text-sm text-muted-foreground">/month</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-4">
                  <li>• Up to 1 user</li>
                  <li>• Up to 3 projects</li>
                  <li>• Basic organization</li>
                  <li>• Public sharing</li>
                  <li>• Community support</li>
                </ul>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handlePlanSelection("free")}
                >
                  Choose Starter
                </Button>
              </CardContent>
            </Card>

            {/* Basic Plan */}
            <Card
              className="cursor-pointer hover:border-primary border-primary border-2 transition-colors relative"
              onClick={() => handlePlanSelection("basic")}
            >
              <div className="absolute top-4 right-4">
                <Badge>Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle>Basic</CardTitle>
                <div className="text-2xl font-bold mt-2">$29</div>
                <p className="text-sm text-muted-foreground">/month</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-4">
                  <li>• Unlimited users</li>
                  <li>• Everything in Starter</li>
                  <li>• Unlimited projects</li>
                  <li>• Team collaboration</li>
                  <li>• Advanced organization</li>
                  <li>• Priority support</li>
                  <li>• PDF export</li>
                </ul>
                <Button
                  className="w-full"
                  onClick={() => handlePlanSelection("basic")}
                >
                  Choose Basic
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Sign Up Form */}
        {selectedPlan && (
          <div>
            <SignUp
              fallbackRedirectUrl={getRedirectUrl()}
              signInFallbackRedirectUrl={getRedirectUrl()}
              appearance={{
                elements: {
                  formButtonPrimary: "bg-primary hover:bg-primary/90",
                  card: "shadow-lg border border-border",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "border border-border hover:bg-muted",
                  formFieldInput: "border border-border",
                  footerActionLink: "text-primary hover:text-primary/80",
                },
              }}
            />
          </div>
        )}

        <CreateTeamModal
          open={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          onContinue={handleTeamCreated}
        />
      </div>
    </div>
  );
}
