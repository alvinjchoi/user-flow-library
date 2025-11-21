"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, ZoomIn, ZoomOut } from "lucide-react";
import mermaid from "mermaid";

interface MermaidEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  initialScript?: string;
  onSave?: (script: string) => void;
}

export function MermaidEditorDialog({
  open,
  onOpenChange,
  flowId,
  initialScript = "",
  onSave,
}: MermaidEditorDialogProps) {
  const [script, setScript] = useState(initialScript);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [renderedSvg, setRenderedSvg] = useState<string>("");
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const renderCounterRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: "basis",
        padding: 8,
        nodeSpacing: 50,
        rankSpacing: 50,
      },
      themeVariables: {
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
    });
  }, []);

  // Load script from localStorage when dialog opens
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem(`mermaid-script-${flowId}`);
      if (stored) {
        setScript(stored);
      } else if (initialScript) {
        setScript(initialScript);
      } else {
        setScript("");
      }
      setError(null);
      setIsValid(false);
      setRenderedSvg("");
      // Reset render counter when dialog opens
      renderCounterRef.current = 0;
      // Abort any in-flight renders
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [open, flowId, initialScript]);

  // Validate and render mermaid script
  const validateAndRender = async (mermaidScript: string) => {
    if (!mermaidScript.trim()) {
      setError(null);
      setIsValid(false);
      setRenderedSvg("");
      return;
    }

    // Abort any previous render
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this render
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Increment render counter to track this render attempt
    const currentRender = ++renderCounterRef.current;

    try {
      // Validate syntax by attempting to parse
      await mermaid.parse(mermaidScript);
      
      // Check if aborted
      if (abortController.signal.aborted) {
        return;
      }
      
      // If valid, render using mermaid.render (preferred method)
      // Use a unique ID for each render
      const uniqueId = `mermaid-${flowId}-${currentRender}-${Date.now()}`;
      
      // Render the mermaid diagram - this returns SVG string without DOM manipulation
      const { svg } = await mermaid.render(uniqueId, mermaidScript);
      
      // Check if aborted or if this is no longer the latest render
      if (abortController.signal.aborted || currentRender !== renderCounterRef.current) {
        return;
      }
      
      // Update state with the rendered SVG
      setRenderedSvg(svg);
      setError(null);
      setIsValid(true);
    } catch (err) {
      // Check if aborted
      if (abortController.signal.aborted) {
        return;
      }

      // Only update error if this is still the latest render attempt
      if (currentRender === renderCounterRef.current) {
        const errorMessage = err instanceof Error ? err.message : "Invalid Mermaid syntax";
        setError(errorMessage);
        setIsValid(false);
        setRenderedSvg("");
      }
    }
  };

  // Debounced validation
  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = setTimeout(() => {
      validateAndRender(script);
    }, 500);

    return () => {
      clearTimeout(timer);
      // Abort any in-flight renders
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Cancel any in-flight renders by incrementing counter
      renderCounterRef.current++;
    };
  }, [script, open]);

  const handleSave = () => {
    if (isValid && script.trim()) {
      localStorage.setItem(`mermaid-script-${flowId}`, script);
      onSave?.(script);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    // Abort any in-flight renders
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setRenderedSvg("");
    onOpenChange(false);
  };

  // Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.1, scale + delta), 5);
    setScale(newScale);
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    setIsTransitioning(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const deltaX = e.clientX - lastPosRef.current.x;
    const deltaY = e.clientY - lastPosRef.current.y;
    setPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Reset zoom
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom in/out with buttons
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.1));
  };

  // Touch handlers for pinch zoom
  const touchStartRef = useRef<{ dist: number; scale: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchStartRef.current = { dist, scale };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const scaleChange = dist / touchStartRef.current.dist;
      const newScale = Math.min(Math.max(0.1, touchStartRef.current.scale * scaleChange), 5);
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[98vw] sm:!max-w-[98vw] !w-[98vw] !max-h-[98vh] !h-[98vh] overflow-hidden !flex !flex-col p-4"
        style={{ maxWidth: '98vw', width: '98vw', height: '98vh', maxHeight: '98vh', display: 'flex', flexDirection: 'column', gap: 0 }}
      >
        <DialogTitle className="pb-2 flex-shrink-0 text-lg font-semibold !leading-none" style={{ minHeight: 0, height: 'auto', flexShrink: 0 }}>
          Mermaid Flowchart Editor
        </DialogTitle>

        <div className="flex gap-6 overflow-hidden" style={{ flex: '1 1 0', minHeight: 0, display: 'flex' }}>
          {/* Left side: Editor */}
          <div className="w-[35%] flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Mermaid Script</label>
              <div className="flex items-center gap-2">
                {isValid && script.trim() && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Valid</span>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Syntax Error</span>
                  </div>
                )}
              </div>
            </div>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter your Mermaid flowchart script here..."
              className="flex-1 font-mono text-sm resize-none !min-h-0"
            />
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right side: Preview */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 border-l pl-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Preview</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetZoom}
                className="h-7 text-xs"
              >
                Reset Zoom
              </Button>
            </div>
            <div
              ref={mermaidRef}
              className="flex-1 overflow-auto bg-muted/30 rounded-md relative cursor-move"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'none' }}
            >
              <div
                className="absolute inset-0 p-4"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'top left',
                  transition: isTransitioning ? 'transform 0.1s ease-out' : 'none',
                  willChange: 'transform'
                }}
              >
                {!script.trim() ? (
                  <div className="text-muted-foreground">
                    Enter Mermaid script to see preview
                  </div>
                ) : renderedSvg ? (
                  <div
                    className="[&_svg]:block [&_svg]:w-fit [&_svg]:h-auto"
                    style={{
                      shapeRendering: 'geometricPrecision',
                      textRendering: 'geometricPrecision',
                    }}
                    dangerouslySetInnerHTML={{ __html: renderedSvg }}
                  />
                ) : error ? (
                  <div className="text-muted-foreground">
                    <span>Rendering...</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <span>Rendering...</span>
                  </div>
                )}
              </div>

              {/* Zoom controls in bottom right */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="text-xs text-center text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
                  {Math.round(scale * 100)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t" style={{ flexShrink: 0, minHeight: 0 }}>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || !script.trim()}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

