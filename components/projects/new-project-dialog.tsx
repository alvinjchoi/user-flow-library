"use client";

import { useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PlatformType = "web" | "ios" | "android";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (name: string, platformType: PlatformType) => void;
}

const platformOptions = [
  {
    value: "web" as PlatformType,
    label: "Web",
    description: "Desktop & responsive web apps",
    icon: Monitor,
    dimensions: "1920×1080 / 1440×900",
  },
  {
    value: "ios" as PlatformType,
    label: "iOS",
    description: "iPhone & iPad apps",
    icon: Smartphone,
    dimensions: "390×844 (iPhone 14)",
  },
  {
    value: "android" as PlatformType,
    label: "Android",
    description: "Android phones & tablets",
    icon: Tablet,
    dimensions: "360×800 / 412×915",
  },
] as const;

export function NewProjectDialog({
  open,
  onOpenChange,
  onCreateProject,
}: NewProjectDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("web");

  const handleCreate = () => {
    if (!projectName.trim()) return;
    onCreateProject(projectName.trim(), selectedPlatform);
    // Reset form
    setProjectName("");
    setSelectedPlatform("web");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && projectName.trim()) {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Choose a platform to set the appropriate screen dimensions for your
            project.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Project Name Input */}
          <div className="grid gap-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="e.g., My Mobile App"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {/* Platform Selection */}
          <div className="grid gap-3">
            <Label>Platform</Label>
            <div className="grid grid-cols-1 gap-3">
              {platformOptions.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatform === platform.value;

                return (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() => setSelectedPlatform(platform.value)}
                    className={`
                      flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all
                      ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-accent/50"
                      }
                    `}
                  >
                    <div
                      className={`
                      p-2 rounded-md flex-shrink-0
                      ${isSelected ? "bg-primary text-primary-foreground" : "bg-accent"}
                    `}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{platform.label}</h3>
                        <span className="text-xs text-muted-foreground">
                          {platform.dimensions}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {platform.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="h-3 w-3 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!projectName.trim()}
          >
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

