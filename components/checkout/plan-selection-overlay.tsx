"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function PlanSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const selectedPlan = searchParams.get("plan");

  useEffect(() => {
    const showPlanSelection = searchParams.get("showPlanSelection");
    if (showPlanSelection === "true") {
      setOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setOpen(false);
    // Remove query params
    router.replace("/dashboard");
  };

  const handleChoosePlan = (plan: string) => {
    // Redirect to checkout/select-team with the selected plan
    router.push(`/checkout/select-team?plan=${plan}`);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Choose a plan</DialogTitle>
            <button
              onClick={handleClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <DialogDescription>
            Select the perfect plan for your team
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
          {/* Starter Plan */}
          <Card
            className={`cursor-pointer hover:border-primary transition-colors ${
              selectedPlan === "starter" ? "border-primary border-2" : ""
            }`}
            onClick={() => handleChoosePlan("starter")}
          >
            <CardHeader>
              <CardTitle>Starter</CardTitle>
              <div className="text-3xl font-bold mt-2">$0</div>
              <p className="text-sm text-muted-foreground">/month</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Unlock unlimited and private boards with essential features
              </p>
              <ul className="space-y-2 text-sm mb-6">
                <li>• Up to 1 user</li>
                <li>• Up to 3 projects</li>
                <li>• Basic organization</li>
                <li>• Public sharing</li>
                <li>• Community support</li>
              </ul>
              <Button
                className="w-full"
                variant={selectedPlan === "starter" ? "default" : "outline"}
                onClick={() => handleChoosePlan("starter")}
              >
                Choose Starter
              </Button>
            </CardContent>
          </Card>

          {/* Basic Plan */}
          <Card
            className={`cursor-pointer hover:border-primary transition-colors relative ${
              selectedPlan === "basic" ? "border-primary border-2" : ""
            }`}
            onClick={() => handleChoosePlan("basic")}
          >
            <div className="absolute top-4 right-4">
              <Badge>Most Popular</Badge>
            </div>
            <CardHeader>
              <CardTitle>Basic</CardTitle>
              <div className="text-3xl font-bold mt-2">$29</div>
              <p className="text-sm text-muted-foreground">/month</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Scale collaboration beyond your team with advanced features and
                security
              </p>
              <ul className="space-y-2 text-sm mb-6">
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
                variant={selectedPlan === "basic" ? "default" : "outline"}
                onClick={() => handleChoosePlan("basic")}
              >
                Choose Basic
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PlanSelectionOverlay() {
  return (
    <Suspense fallback={null}>
      <PlanSelectionContent />
    </Suspense>
  );
}

