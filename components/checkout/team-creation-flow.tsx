"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateTeamModal } from "./create-team-modal";

function TeamCreationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const showTeamCreation = searchParams.get("showTeamCreation");
    const plan = searchParams.get("plan");
    if (showTeamCreation === "true" && plan === "basic") {
      setShowModal(true);
    }
  }, [searchParams]);

  const handleTeamCreated = async (teamName: string) => {
    setShowModal(false);
    
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
    <CreateTeamModal
      open={showModal}
      onClose={() => {
        setShowModal(false);
        router.replace("/dashboard");
      }}
      onContinue={handleTeamCreated}
    />
  );
}

export function TeamCreationFlow() {
  return (
    <Suspense fallback={null}>
      <TeamCreationContent />
    </Suspense>
  );
}

