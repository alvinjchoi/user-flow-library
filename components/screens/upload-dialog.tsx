"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { uploadScreenshot } from "@/lib/storage";
import { updateScreen } from "@/lib/flows";
import type { Screen } from "@/lib/database.types";

// Utility to analyze screenshot with AI
async function analyzeScreenshot(imageUrl: string, context?: { title: string; description: string | null }[]) {
  const response = await fetch("/api/analyze-screenshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl, context }),
  });
  
  if (!response.ok) {
    throw new Error("AI analysis failed");
  }
  
  return response.json();
}

interface UploadDialogProps {
  screenId: string;
  screenTitle: string;
  allScreens: Screen[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: (url: string, title?: string, displayName?: string, description?: string) => void;
}

export function UploadDialog({
  screenId,
  screenTitle,
  allScreens,
  open,
  onOpenChange,
  onUploadComplete,
}: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiDisplayName, setAiDisplayName] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [useAI, setUseAI] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const analyzeScreenshot = async (imageUrl: string) => {
    // Build context from existing screens
    const context = allScreens
      .filter(s => s.screenshot_url)
      .map(s => ({
        title: s.title,
        description: s.notes
      }));

    const response = await fetch('/api/analyze-screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, context }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze screenshot');
    }

    return response.json();
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // 1. Upload to Supabase Storage
      const url = await uploadScreenshot(file, screenId);

      if (!url) {
        throw new Error("Failed to upload file");
      }

      let finalTitle = aiTitle;
      let finalDisplayName = aiDisplayName;
      let finalDescription = aiDescription;

      // 2. Analyze with AI if enabled and not already analyzed
      if (useAI && !aiTitle) {
        setAnalyzing(true);
        try {
          // Build context from other screens
          const context = allScreens
            .filter((s) => s.screenshot_url)
            .map((s) => ({
              title: s.title,
              description: s.notes,
            }));
          
          const analysis = await analyzeScreenshot(url, context);
          finalTitle = analysis.title;
          finalDisplayName = analysis.displayName || analysis.title;
          finalDescription = analysis.description;
          setAiTitle(analysis.title);
          setAiDisplayName(analysis.displayName || analysis.title);
          setAiDescription(analysis.description);
        } catch (aiError) {
          console.error("AI analysis failed:", aiError);
          // Continue without AI suggestions - don't block upload
        } finally {
          setAnalyzing(false);
        }
      }

      // 3. Update screen record with screenshot URL and AI data
      await updateScreen(screenId, {
        screenshot_url: url,
        ...(finalTitle && { title: finalTitle }),
        ...(finalDisplayName && { display_name: finalDisplayName }),
        ...(finalDescription && { notes: finalDescription })
      });

      // Notify parent
      onUploadComplete?.(url, finalTitle, finalDisplayName, finalDescription);

      // Close dialog
      onOpenChange(false);

      // Reset state
      setFile(null);
      setPreview(null);
      setAiTitle("");
      setAiDisplayName("");
      setAiDescription("");
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload screenshot"
      );
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Simulate file input change
      const dt = new DataTransfer();
      dt.items.add(droppedFile);
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files;
        handleFileSelect({
          target: fileInputRef.current,
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Screenshot</DialogTitle>
          <DialogDescription>
            {useAI ? "AI will auto-name and describe your screen" : screenTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!preview ? (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="aspect-[9/16] relative rounded-lg overflow-hidden bg-muted">
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
                  setAiDisplayName("");
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

          {aiTitle && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-purple-500" />
                  Technical Name (for developers)
                </Label>
                <Input
                  id="title"
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  placeholder="e.g., Search Screen"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName" className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-purple-500" />
                  Display Name (for sidebar)
                </Label>
                <Input
                  id="displayName"
                  value={aiDisplayName}
                  onChange={(e) => setAiDisplayName(e.target.value)}
                  placeholder="e.g., Searching Reddit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-purple-500" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Screen description"
                  rows={3}
                />
              </div>
            </>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useAI"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="useAI" className="text-sm cursor-pointer font-normal">
              Use AI to auto-name
            </Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading || analyzing}
              className="min-w-28"
            >
              {analyzing ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  Analyzing...
                </>
              ) : uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
