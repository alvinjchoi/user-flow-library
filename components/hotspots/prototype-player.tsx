"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowLeft, Home } from "lucide-react";
import type { Screen, Hotspot } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface PrototypePlayerProps {
  startScreen: Screen;
  allScreens: Screen[];
  hotspotsByScreen: Map<string, Hotspot[]>;
  onClose: () => void;
}

export function PrototypePlayer({
  startScreen,
  allScreens,
  hotspotsByScreen,
  onClose,
}: PrototypePlayerProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>(startScreen);
  const [navigationHistory, setNavigationHistory] = useState<Screen[]>([startScreen]);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const currentHotspots = hotspotsByScreen.get(currentScreen.id) || [];

  // Navigate to screen
  const navigateToScreen = useCallback((screenId: string) => {
    const targetScreen = allScreens.find((s) => s.id === screenId);
    if (!targetScreen) return;

    setCurrentScreen(targetScreen);
    setNavigationHistory((prev) => [...prev, targetScreen]);
    setHoveredHotspot(null);
  }, [allScreens]);

  // Go back
  const goBack = useCallback(() => {
    if (navigationHistory.length <= 1) return;

    const newHistory = [...navigationHistory];
    newHistory.pop(); // Remove current screen
    const previousScreen = newHistory[newHistory.length - 1];

    setCurrentScreen(previousScreen);
    setNavigationHistory(newHistory);
    setHoveredHotspot(null);
  }, [navigationHistory]);

  // Reset to start
  const goHome = useCallback(() => {
    setCurrentScreen(startScreen);
    setNavigationHistory([startScreen]);
    setHoveredHotspot(null);
  }, [startScreen]);

  // Handle hotspot click
  const handleHotspotClick = (hotspot: Hotspot) => {
    if (!hotspot.target_screen_id) return;

    switch (hotspot.interaction_type) {
      case 'navigate':
        navigateToScreen(hotspot.target_screen_id);
        break;
      case 'back':
        goBack();
        break;
      case 'replace':
        // Replace current screen in history
        const newHistory = [...navigationHistory];
        newHistory[newHistory.length - 1] = allScreens.find((s) => s.id === hotspot.target_screen_id)!;
        setCurrentScreen(newHistory[newHistory.length - 1]);
        setNavigationHistory(newHistory);
        setHoveredHotspot(null);
        break;
      case 'overlay':
        // For now, treat same as navigate
        // TODO: Implement modal/overlay behavior
        navigateToScreen(hotspot.target_screen_id);
        break;
      default:
        navigateToScreen(hotspot.target_screen_id);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
        goBack();
      } else if (e.key === 'h' || e.key === 'Home') {
        goHome();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goBack, goHome]);

  // Track image size for positioning hotspots
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.offsetWidth, height: img.offsetHeight });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={navigationHistory.length <= 1}
              className="text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goHome}
              disabled={navigationHistory.length <= 1}
              className="text-white hover:bg-white/10 disabled:opacity-30"
            >
              <Home className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          <div className="text-white text-sm">
            <span className="text-white/60">Prototype: </span>
            <span className="font-medium">{currentScreen.display_name || currentScreen.title}</span>
          </div>

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

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 pt-20">
        <div className="relative max-w-full max-h-full">
          {currentScreen.screenshot_url ? (
            <>
              <img
                src={currentScreen.screenshot_url}
                alt={currentScreen.title}
                className="max-w-full max-h-[calc(100vh-120px)] object-contain rounded-lg shadow-2xl"
                onLoad={handleImageLoad}
                draggable={false}
              />

              {/* Interactive Hotspots */}
              {imageSize.width > 0 && currentHotspots.map((hotspot) => {
                const isHovered = hoveredHotspot === hotspot.id;
                const hasTarget = !!hotspot.target_screen_id;
                
                return (
                  <div
                    key={hotspot.id}
                    className={`absolute transition-all ${
                      hasTarget
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed opacity-30'
                    } ${
                      isHovered && hasTarget
                        ? 'bg-primary/30 ring-2 ring-primary shadow-lg'
                        : 'bg-transparent hover:bg-blue-400/20'
                    }`}
                    style={{
                      left: `${hotspot.x_position}%`,
                      top: `${hotspot.y_position}%`,
                      width: `${hotspot.width}%`,
                      height: `${hotspot.height}%`,
                    }}
                    onClick={() => hasTarget && handleHotspotClick(hotspot)}
                    onMouseEnter={() => hasTarget && setHoveredHotspot(hotspot.id)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  >
                    {/* Tooltip on hover */}
                    {isHovered && hasTarget && hotspot.element_label && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-sm px-3 py-1.5 rounded whitespace-nowrap shadow-lg z-10">
                        {hotspot.element_label}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45" />
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-white/50 p-20">
              <p className="text-lg mb-2">No screenshot available</p>
              <p className="text-sm">This screen doesn't have a screenshot yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Navigation Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between text-white/60 text-sm">
          <div>
            {currentHotspots.filter((h) => h.target_screen_id).length > 0 ? (
              <span>
                {currentHotspots.filter((h) => h.target_screen_id).length} clickable area(s)
              </span>
            ) : (
              <span>No interactive elements on this screen</span>
            )}
          </div>
          <div className="flex gap-4">
            <span>ESC to exit</span>
            <span>← or Backspace to go back</span>
            <span>H to reset</span>
          </div>
        </div>
      </div>
    </div>
  );
}

