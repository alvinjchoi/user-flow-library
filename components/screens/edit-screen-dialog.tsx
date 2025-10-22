"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, X, Image as ImageIcon, Sparkles, Loader2, Save, Edit2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Screen } from "@/lib/database.types";
import { updateScreen } from "@/lib/flows";
import { uploadScreenshot } from "@/lib/storage";

// Utility to analyze screenshot with AI
async function analyzeScreenshot(imageUrl: string) {
  const response = await fetch("/api/analyze-screenshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });
  
  if (!response.ok) {
    throw new Error("AI analysis failed");
  }
  
  return response.json();
}

interface EditScreenDialogProps {
  screen: Screen | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updatedScreen: Screen) => void;
  availableScreens: Screen[];
}

export function EditScreenDialog({
  screen,
  open,
  onOpenChange,
  onUpdate,
  availableScreens,
}: EditScreenDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [parentId, setParentId] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // File upload and AI analysis state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when screen changes
  useEffect(() => {
    if (screen && open) {
      setTitle(screen.title);
      setDescription(screen.notes || "");
      setDisplayName(screen.display_name || screen.title);
      setParentId(screen.parent_id || "none");
      setError(null);
      setLoading(false);
      setFile(null);
      setPreview(null);
      setAiTitle("");
      setAiDescription("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [screen, open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const analyzeWithAI = async (imageUrl: string) => {
    setAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeScreenshot(imageUrl);
      setAiTitle(analysis.title);
      setAiDescription(analysis.description);
      
      // Pre-populate the fields
      setTitle(analysis.title);
      setDescription(analysis.description || "");
      setDisplayName(analysis.displayName || analysis.title);
    } catch (err) {
      console.error("AI analysis failed:", err);
      setError("AI analysis failed - you can still edit manually");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (preview) {
      analyzeWithAI(preview);
    }
  }, [preview]);

  const handleSave = async () => {
    if (!screen || !title.trim()) {
      setError("Screen title cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      // Prepare updates
      const updates: Partial<Screen> = {
        title: title.trim(),
        display_name: displayName.trim() || title.trim(),
        notes: description.trim() || null,
        parent_id: parentId === "none" ? null : parentId,
      };

      // If there's a new screenshot file, upload it
      if (file) {
        try {
          const screenshotUrl = await uploadScreenshot(file, screen.id);
          if (screenshotUrl) {
            updates.screenshot_url = screenshotUrl;
          }
        } catch (uploadError) {
          console.error("Error uploading screenshot:", uploadError);
          setError("Failed to upload screenshot, but other changes will be saved");
        }
      }

      // Update the screen
      const updatedScreen = await updateScreen(screen.id, updates);
      
      // Notify parent
      onUpdate(updatedScreen);

      // Close dialog
      onOpenChange(false);
    } catch (err) {
      console.error("Error updating screen:", err);
      setError(err instanceof Error ? err.message : "Failed to update screen");
    } finally {
      setLoading(false);
    }
  };

  if (!screen) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Edit Screen</DialogTitle>
          <DialogDescription>
            Update screen details and optionally upload a new screenshot.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Left Column - Screenshot */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="screenshot">Screenshot</Label>
              {screen.screenshot_url && !preview ? (
                <div className="relative">
                  <div className="aspect-[9/16] relative rounded-lg overflow-hidden bg-muted max-w-[280px] mx-auto">
                    <img
                      src={screen.screenshot_url}
                      alt="Current screenshot"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : !preview ? (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer min-h-[300px] flex flex-col items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    Click to upload screenshot
                  </p>
                  <p className="text-sm text-muted-foreground">
                    AI will suggest new title and description
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="aspect-[9/16] relative rounded-lg overflow-hidden bg-muted max-w-[280px] mx-auto">
                    <img
                      src={preview}
                      alt="New preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      setAiTitle("");
                      setAiDescription("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* AI Analysis Results */}
            {analyzing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing screenshot...
              </div>
            )}

            {aiTitle && (
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    AI Suggestions
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Title:</strong> {aiTitle}
                </p>
                {aiDescription && (
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    <strong>Description:</strong> {aiDescription}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Configuration Options */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name (Sidebar)</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Managing projects"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Action-oriented name shown in sidebar (e.g., "Searching posts", "Adding comments")
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Technical Name</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Projects Screen"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Technical name for developers (e.g., "Projects Screen", "Search Screen")
              </p>
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="parent">Stems from (Optional)</Label>
              <Select
                value={parentId}
                onValueChange={setParentId}
                disabled={loading}
              >
                <SelectTrigger id="parent">
                  <SelectValue placeholder="No parent (root level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">
                      No parent (root level)
                    </span>
                  </SelectItem>
                  {availableScreens
                    .filter(s => s.id !== screen.id) // Don't allow self as parent
                    .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a parent screen to create a hierarchical structure
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what happens on this screen..."
                disabled={loading}
                rows={3}
              />
            </div>
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
          <Button onClick={handleSave} disabled={!title.trim() || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
