"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Plus,
} from "lucide-react";
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
import { generateCompressedDataUrl } from "@/lib/image-utils";

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

interface AddScreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (title: string, parentId?: string, screenshotFile?: File) => void;
  availableScreens: Screen[];
  flowName: string;
  defaultParentId?: string;
}

export function AddScreenDialog({
  open,
  onOpenChange,
  onAdd,
  availableScreens,
  flowName,
  defaultParentId,
}: AddScreenDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [parentId, setParentId] = useState<string>(defaultParentId || "none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New state for file upload and AI analysis
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setParentId(defaultParentId || "none");
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
  }, [open, defaultParentId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      const compressedPreview = await generateCompressedDataUrl(selectedFile);
      setPreview(compressedPreview);
    } catch (compressionError) {
      console.error("Failed to create preview:", compressionError);
      setError("Failed to generate preview for analysis");
    }
  };

  const analyzeWithAI = async (imageUrl: string) => {
    setAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeScreenshot(imageUrl);
      setAiTitle(analysis.title);
      setAiDescription(analysis.description);

      // Pre-populate the title, description, and displayName fields
      setTitle(analysis.title);
      setDescription(analysis.description || "");
      setDisplayName(analysis.displayName || analysis.title);

      // Try to suggest a parent based on AI analysis
      // This is a simple heuristic - you could make this smarter
      if (
        analysis.title.toLowerCase().includes("login") ||
        analysis.title.toLowerCase().includes("sign")
      ) {
        // Look for existing auth-related screens
        const authParent = availableScreens.find(
          (s) =>
            s.title.toLowerCase().includes("login") ||
            s.title.toLowerCase().includes("sign")
        );
        if (authParent) {
          setParentId(authParent.id);
        }
      }
    } catch (err) {
      console.error("AI analysis failed:", err);
      setError("AI analysis failed - you can still add the screen manually");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (preview) {
      analyzeWithAI(preview);
    }
  }, [preview]);

  const handleAdd = async () => {
    if (!title.trim()) {
      setError("Screen title cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      await onAdd(
        title.trim(),
        parentId === "none" ? undefined : parentId,
        file || undefined
      );

      // Reset form (handled by useEffect on dialog close)
      onOpenChange(false);
    } catch (err) {
      console.error("Error adding screen:", err);
      setError(err instanceof Error ? err.message : "Failed to add screen");
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
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Add Screen to {flowName}</DialogTitle>
          <DialogDescription>
            Create a new screen and optionally choose which screen it stems
            from.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Left Column - File Upload (Wider) */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="screenshot">Screenshot (Optional)</Label>
              {!preview ? (
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
                    AI will suggest title and parent
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="aspect-[9/16] relative rounded-lg overflow-hidden bg-muted max-w-[280px] mx-auto">
                    <img
                      src={preview}
                      alt="Preview"
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
                Action-oriented name shown in sidebar (e.g., "Searching posts",
                "Adding comments")
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Technical Name</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="e.g., Projects Screen"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Technical name for developers (e.g., "Projects Screen", "Search
                Screen")
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
          <Button onClick={handleAdd} disabled={!title.trim() || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" /> Add Screen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
