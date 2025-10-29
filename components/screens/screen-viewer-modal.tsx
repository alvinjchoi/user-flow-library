"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Edit2, Upload } from "lucide-react";
import Image from "next/image";
import type { Screen } from "@/lib/database.types";
import { Button } from "@/components/ui/button";

interface ScreenViewerModalProps {
  screen: Screen | null;
  allScreens: Screen[];
  onClose: () => void;
  onNavigate?: (screen: Screen) => void;
  onEdit?: (screen: Screen) => void;
  onUploadScreenshot?: (screenId: string) => void;
}

export function ScreenViewerModal({
  screen,
  allScreens,
  onClose,
  onNavigate,
  onEdit,
  onUploadScreenshot,
}: ScreenViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Update current index when screen changes
  useEffect(() => {
    if (screen) {
      const index = allScreens.findIndex((s) => s.id === screen.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [screen, allScreens]);

  const currentScreen = allScreens[currentIndex] || screen;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allScreens.length - 1;

  const handlePrevious = useCallback(() => {
    if (hasPrevious) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onNavigate?.(allScreens[newIndex]);
    }
  }, [hasPrevious, currentIndex, allScreens, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onNavigate?.(allScreens[newIndex]);
    }
  }, [hasNext, currentIndex, allScreens, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handlePrevious, handleNext]);

  if (!screen || !currentScreen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 bg-gradient-to-b from-black/60 to-transparent z-10">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-white text-xl font-semibold">
              {currentScreen.display_name || currentScreen.title}
            </h2>
            {currentScreen.notes && (
              <p className="text-white/80 text-sm mt-1">
                {currentScreen.notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(currentScreen)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onUploadScreenshot && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onUploadScreenshot(currentScreen.id)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Upload className="h-4 w-4 mr-2" />
              {currentScreen.screenshot_url ? "Replace" : "Upload"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Previous Button */}
      {hasPrevious && (
        <button
          onClick={handlePrevious}
          className="absolute left-8 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-all"
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>
      )}

      {/* Next Button */}
      {hasNext && (
        <button
          onClick={handleNext}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-all"
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>
      )}

      {/* Main Content */}
      <div className="relative w-full h-full flex items-center justify-center p-20">
        {currentScreen.screenshot_url ? (
          <div className="relative max-w-[600px] max-h-full aspect-[9/19.5]">
            <img
              src={currentScreen.screenshot_url}
              alt={currentScreen.title}
              className="w-full h-full object-contain rounded-[27px] shadow-2xl"
              style={{
                boxShadow:
                  "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
              }}
            />
          </div>
        ) : (
          <div className="relative max-w-[600px] aspect-[9/19.5] bg-muted rounded-[27px] flex items-center justify-center">
            <div className="text-center">
              <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No screenshot</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Screen counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
        <p className="text-white text-sm">
          {currentIndex + 1} / {allScreens.length}
        </p>
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close modal"
      />
    </div>
  );
}

