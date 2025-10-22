"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Database, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function SetupBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if setup is already marked complete
    const setupComplete = localStorage.getItem("supabase-setup-complete");
    if (setupComplete === "true") {
      return;
    }

    // Test Supabase connection once
    let mounted = true;

    async function checkSupabase() {
      try {
        const { error } = await supabase
          .from("patterns")
          .select("id", { count: "exact", head: true });

        if (error && mounted) {
          // Table doesn't exist or other error
          setShowBanner(true);
        } else if (!error && mounted) {
          // Connection successful, mark as complete
          localStorage.setItem("supabase-setup-complete", "true");
        }
      } catch (error) {
        // Connection error
        if (mounted) setShowBanner(true);
      }
    }

    checkSupabase();

    return () => {
      mounted = false;
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
  };

  const markComplete = () => {
    localStorage.setItem("supabase-setup-complete", "true");
    setShowBanner(false);
    window.location.reload(); // Reload to trigger migration
  };

  if (!showBanner || dismissed) return null;

  return (
    <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950 dark:border-orange-900 rounded-none border-x-0 border-t-0">
      <Database className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertDescription className="ml-2 flex items-center justify-between gap-4">
        <div className="flex-1">
          <strong className="text-orange-900 dark:text-orange-100">
            ⚠️ Setup Required:
          </strong>
          <span className="text-orange-800 dark:text-orange-200 ml-2">
            Create the Supabase patterns table to enable database features.
            Currently using local fallback data.
          </span>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
              <a
                href="https://supabase.com/dashboard/project/jrhnlbilfozzrdphcvxp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1"
              >
                Open Supabase <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => window.open("/CREATE_TABLE.sql", "_blank")}
            >
              View SQL
            </Button>
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs"
              onClick={markComplete}
            >
              I've created the table
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
