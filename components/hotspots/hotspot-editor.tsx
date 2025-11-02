"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import type { Hotspot, Screen } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HotspotEditorProps {
  screen: Screen;
  hotspots: Hotspot[];
  availableScreens: Screen[];
  onAddHotspot: (
    hotspot: Omit<Hotspot, "id" | "created_at" | "updated_at">
  ) => Promise<void>;
  onUpdateHotspot: (id: string, updates: Partial<Hotspot>) => Promise<void>;
  onDeleteHotspot: (id: string) => Promise<void>;
  onClose: () => void;
}

interface DrawingBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function HotspotEditor({
  screen,
  hotspots,
  availableScreens,
  onAddHotspot,
  onUpdateHotspot,
  onDeleteHotspot,
  onClose,
}: HotspotEditorProps) {
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingBox, setDrawingBox] = useState<DrawingBox | null>(null);
  const [isAIDetecting, setIsAIDetecting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [drawMode, setDrawMode] = useState(false); // Explicit draw mode toggle
  const imageRef = useRef<HTMLImageElement>(null);

  // Debug: Log hotspots whenever they change
  useEffect(() => {
    console.log(
      `[HotspotEditor] Hotspots updated: ${hotspots.length} total`,
      hotspots
    );
  }, [hotspots]);

  // Handle mouse down to start drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow drawing in draw mode
    if (!drawMode || selectedHotspot || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setDrawingBox({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    });
  };

  // Handle mouse move while drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawingBox || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setDrawingBox({
      ...drawingBox,
      endX: Math.max(0, Math.min(100, x)),
      endY: Math.max(0, Math.min(100, y)),
    });
  };

  // Handle mouse up to finish drawing
  const handleMouseUp = async () => {
    if (!isDrawing || !drawingBox) return;

    setIsDrawing(false);

    // Calculate normalized bounding box
    const x = Math.min(drawingBox.startX, drawingBox.endX);
    const y = Math.min(drawingBox.startY, drawingBox.endY);
    const width = Math.abs(drawingBox.endX - drawingBox.startX);
    const height = Math.abs(drawingBox.endY - drawingBox.startY);

    // Only create hotspot if box is large enough (at least 2% in both dimensions)
    if (width > 2 && height > 2) {
      try {
        await onAddHotspot({
          screen_id: screen.id,
          x_position: x,
          y_position: y,
          width,
          height,
          element_type: null,
          element_label: null,
          element_description: null,
          target_screen_id: null,
          interaction_type: "navigate",
          confidence_score: null,
          is_ai_generated: false,
          order_index: hotspots.length,
        });
      } catch (error) {
        console.error("Error creating hotspot:", error);
        alert("Failed to create hotspot");
      }
    }

    setDrawingBox(null);
  };

  // Handle AI auto-detect
  const handleAIDetect = async () => {
    setIsAIDetecting(true);
    try {
      const response = await fetch(
        `/api/screens/${screen.id}/detect-elements`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to detect elements");
      }

      const data = await response.json();

      // Log full response for debugging
      console.log("=== AI Detection Response ===");
      console.log("Full data:", JSON.stringify(data, null, 2));
      console.log("Elements count:", data.elements?.length || 0);
      console.log("Detection method:", data.method);
      console.log("=============================");

      // Log detection method used
      const detectionMethod = data.method || "unknown";
      const methodLabel =
        detectionMethod === "screencoder"
          ? "🎨 ScreenCoder"
          : detectionMethod === "uied"
          ? "🔍 UIED"
          : detectionMethod === "gpt4"
          ? "✨ GPT-4 Vision"
          : detectionMethod === "fallback"
          ? "⚠️ GPT-4 (Fallback)"
          : "❓ Unknown";

      console.log(`Detection method: ${methodLabel}`, data);

      // Create hotspots for each detected element
      let successCount = 0;
      let errorCount = 0;

      console.log(`Creating ${data.elements?.length || 0} hotspots...`);

      for (const element of data.elements || []) {
        try {
          console.log("Creating hotspot:", {
            label: element.label,
            position: element.boundingBox,
          });

          await onAddHotspot({
            screen_id: screen.id,
            x_position: element.boundingBox.x,
            y_position: element.boundingBox.y,
            width: element.boundingBox.width,
            height: element.boundingBox.height,
            element_type: element.type,
            element_label: element.label,
            element_description: element.description,
            target_screen_id: null,
            interaction_type: "navigate",
            confidence_score: element.confidence,
            is_ai_generated: true,
            order_index: hotspots.length + element.order_index,
          });
          successCount++;
          console.log(`✅ Hotspot created: ${element.label}`);
        } catch (error) {
          errorCount++;
          console.error("❌ Failed to create hotspot:", element.label, error);
        }
      }

      console.log(
        `Hotspot creation complete: ${successCount} success, ${errorCount} failed`
      );

      // Show detailed success message with detection method
      const message = `${methodLabel}\n\nDetected ${
        data.elements.length
      } elements\nCreated ${successCount} hotspots${
        errorCount > 0 ? `\n⚠️ Failed: ${errorCount}` : ""
      }${data.warning ? `\n\n${data.warning}` : ""}`;

      alert(message);
    } catch (error) {
      console.error("Error detecting elements:", error);
      alert(
        "❌ Failed to detect elements.\n\nPlease check:\n• OpenAI API key is configured\n• Image URL is accessible\n• Network connection"
      );
    } finally {
      setIsAIDetecting(false);
    }
  };

  // Handle hotspot selection
  const handleSelectHotspot = (hotspot: Hotspot) => {
    setSelectedHotspot(selectedHotspot?.id === hotspot.id ? null : hotspot);
  };

  // Handle target screen change
  const handleTargetChange = async (targetScreenId: string) => {
    if (!selectedHotspot) return;

    try {
      await onUpdateHotspot(selectedHotspot.id, {
        target_screen_id: targetScreenId,
      });
      setSelectedHotspot({
        ...selectedHotspot,
        target_screen_id: targetScreenId,
      });
    } catch (error) {
      console.error("Error updating hotspot:", error);
      alert("Failed to update hotspot");
    }
  };

  // Handle label change
  const handleLabelChange = async (label: string) => {
    if (!selectedHotspot) return;

    try {
      await onUpdateHotspot(selectedHotspot.id, {
        element_label: label,
      });
      setSelectedHotspot({
        ...selectedHotspot,
        element_label: label,
      });
    } catch (error) {
      console.error("Error updating hotspot:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-xl font-semibold">Hotspot Editor</h2>
            <p className="text-white/70 text-sm mt-1">
              {drawMode
                ? "🎯 Draw Mode: Click and drag to create hotspot boxes"
                : "Click 'Draw Mode' to manually add hotspots, or use AI"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setDrawMode(!drawMode);
                setSelectedHotspot(null);
              }}
              variant="default"
              className={
                drawMode
                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                  : "bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              {drawMode ? "Drawing..." : "Draw Mode"}
            </Button>
            <Button
              onClick={handleAIDetect}
              disabled={isAIDetecting}
              className="bg-primary hover:bg-primary/90"
            >
              {isAIDetecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Auto-Detect
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-full pt-24 pb-6 px-6 gap-6">
        {/* Image with Hotspots Overlay */}
        <div className="flex-1 flex items-center justify-center relative">
          <div
            className={`relative ${drawMode ? "cursor-crosshair" : ""}`}
            style={{ maxWidth: "100%", maxHeight: "100%" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {screen.screenshot_url && (
              <img
                ref={imageRef}
                src={screen.screenshot_url}
                alt={screen.title}
                className="max-w-full max-h-[calc(100vh-200px)] object-contain"
                draggable={false}
              />
            )}

            {/* Existing Hotspots */}
            {imageRef.current &&
              hotspots.map((hotspot) => {
                const isSelected = selectedHotspot?.id === hotspot.id;
                return (
                  <div
                    key={hotspot.id}
                    className={`absolute border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/20 ring-2 ring-primary"
                        : "border-blue-400 bg-blue-400/10 hover:bg-blue-400/20"
                    }`}
                    style={{
                      left: `${hotspot.x_position}%`,
                      top: `${hotspot.y_position}%`,
                      width: `${hotspot.width}%`,
                      height: `${hotspot.height}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectHotspot(hotspot);
                    }}
                  >
                    {/* Label overlay - positioned to avoid screen edges */}
                    {hotspot.element_label && (
                      <div
                        className={`absolute bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap ${
                          hotspot.y_position < 8 ? "top-full mt-1" : "-top-6"
                        } ${hotspot.x_position > 70 ? "right-0" : "left-0"}`}
                      >
                        {hotspot.element_label}
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Drawing Box */}
            {isDrawing && drawingBox && (
              <div
                className="absolute border-2 border-primary bg-primary/20"
                style={{
                  left: `${Math.min(drawingBox.startX, drawingBox.endX)}%`,
                  top: `${Math.min(drawingBox.startY, drawingBox.endY)}%`,
                  width: `${Math.abs(drawingBox.endX - drawingBox.startX)}%`,
                  height: `${Math.abs(drawingBox.endY - drawingBox.startY)}%`,
                }}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-96 bg-card rounded-lg p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {selectedHotspot ? "Edit Hotspot" : "Hotspots"}
            </h3>
            {selectedHotspot && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedHotspot(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>

          {selectedHotspot ? (
            /* Selected Hotspot Details */
            <div className="space-y-4">
              <div>
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={selectedHotspot.element_label || ""}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="Button label or description"
                />
              </div>

              <div>
                <Label htmlFor="target">Navigate To</Label>
                <Select
                  value={selectedHotspot.target_screen_id || ""}
                  onValueChange={handleTargetChange}
                >
                  <SelectTrigger id="target">
                    <SelectValue placeholder="Select target screen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableScreens.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.display_name || s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedHotspot.is_ai_generated && (
                <div className="bg-muted p-3 rounded text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium">AI Detected</span>
                  </div>
                  {selectedHotspot.element_description && (
                    <p className="text-muted-foreground">
                      {selectedHotspot.element_description}
                    </p>
                  )}
                  {selectedHotspot.confidence_score && (
                    <p className="text-muted-foreground mt-1">
                      Confidence:{" "}
                      {(selectedHotspot.confidence_score * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedHotspot(null)}
                  className="flex-1"
                >
                  Deselect
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await onDeleteHotspot(selectedHotspot.id);
                    setSelectedHotspot(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            /* Hotspots List */
            <div className="space-y-2">
              {hotspots.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p className="mb-4">No hotspots yet</p>
                  <p className="text-sm">
                    Draw a box on the screenshot or use AI to detect elements
                  </p>
                </div>
              ) : (
                hotspots.map((hotspot, index) => (
                  <div
                    key={hotspot.id}
                    className="group p-3 border rounded hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleSelectHotspot(hotspot)}
                      >
                        <span className="font-medium">
                          {hotspot.element_label || `Hotspot ${index + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {hotspot.is_ai_generated && (
                          <Sparkles className="h-3 w-3 text-primary" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `Delete "${
                                  hotspot.element_label || "this hotspot"
                                }"?`
                              )
                            ) {
                              onDeleteHotspot(hotspot.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {hotspot.target_screen_id && (
                      <p
                        className="text-xs text-muted-foreground cursor-pointer"
                        onClick={() => handleSelectHotspot(hotspot)}
                      >
                        →{" "}
                        {availableScreens.find(
                          (s) => s.id === hotspot.target_screen_id
                        )?.display_name || "Target"}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
