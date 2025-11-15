"use client";

import { useEffect, useState } from "react";
import { useUser, useOrganizationList } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SelectTeamPage() {
  const { user } = useUser();
  const { organizationList, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "starter";
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "User Flow Library | Choose Team";
  }, []);

  const handleUpgrade = (orgId: string) => {
    router.push(`/checkout/payment?plan=${plan}&orgId=${orgId}`);
  };

  const handleCreateNewTeam = () => {
    // Redirect to organization creation, which will then redirect back to select-team
    router.push(`/organization/new`);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
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
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-8">
            Choose a team to upgrade to {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
          </h1>

          {/* Team list */}
          <div className="space-y-4 mb-6">
            {organizationList?.map(({ organization }) => {
              const memberCount = organization.membersCount || 0;
              const planType = (organization as any).publicMetadata?.plan || "free";
              
              return (
                <Card key={organization.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Team icon */}
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-bold text-lg">
                            {organization.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        {/* Team info */}
                        <div>
                          <h3 className="font-semibold text-lg">{organization.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {planType === "free" ? "Free team" : `${planType.charAt(0).toUpperCase() + planType.slice(1)} team`} · {memberCount} {memberCount === 1 ? "member" : "members"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Upgrade button */}
                      <Button
                        onClick={() => handleUpgrade(organization.id)}
                        disabled={loading}
                      >
                        Upgrade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Create new team */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCreateNewTeam}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create a new paid team
          </Button>
        </div>
      </main>
    </div>
  );
}

