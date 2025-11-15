"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface CreateTeamModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: (teamName: string) => void;
}

export function CreateTeamModal({
  open,
  onClose,
  onContinue,
}: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState("");

  const handleContinue = () => {
    if (teamName.trim()) {
      onContinue(teamName.trim());
      setTeamName("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && teamName.trim()) {
      handleContinue();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Create new team</DialogTitle>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <DialogDescription className="pt-2">
            Name your team before choosing a new plan subscription.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team name</Label>
            <Input
              id="teamName"
              placeholder="Enter team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleContinue}
              disabled={!teamName.trim()}
              className="flex-1"
            >
              Continue
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

