"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Screen } from "@/lib/database.types";
import { Plus } from "lucide-react";

interface AddScreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (title: string, parentId?: string) => void;
  availableScreens: Screen[];
  flowName: string;
}

export function AddScreenDialog({
  open,
  onOpenChange,
  onAdd,
  availableScreens,
  flowName,
}: AddScreenDialogProps) {
  const [title, setTitle] = useState("");
  const [parentId, setParentId] = useState<string>("none");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onAdd(title.trim(), parentId === "none" ? undefined : parentId);

      // Reset form
      setTitle("");
      setParentId("none");
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding screen:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && title.trim()) {
      handleAdd();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Screen to {flowName}</DialogTitle>
          <DialogDescription>
            Create a new screen and optionally choose which screen it stems
            from.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Screen Title</Label>
            <Input
              id="title"
              placeholder="e.g., Sign in with Google"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="parent">Stems from (Optional)</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger id="parent">
                <SelectValue placeholder="No parent (root level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">
                    No parent (root level)
                  </span>
                </SelectItem>
                {availableScreens.map((screen) => (
                  <SelectItem key={screen.id} value={screen.id}>
                    {screen.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select a parent screen to create a hierarchical structure
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!title.trim() || loading}>
            <Plus className="h-4 w-4 mr-2" />
            Add Screen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
