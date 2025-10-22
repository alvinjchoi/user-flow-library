"use client";

import Image from "next/image";
import { Plus, Upload, CornerDownRight } from "lucide-react";
import type { Screen } from "@/lib/database.types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ScreenGalleryProps {
  screens: Screen[];
  onSelectScreen?: (screen: Screen) => void;
  onUploadScreenshot?: (screenId: string) => void;
  onAddScreen?: () => void;
  selectedScreenId?: string;
}

interface ScreenWithChildren extends Screen {
  children: ScreenWithChildren[];
  level: number;
}

// Build hierarchical structure for display
function buildScreenHierarchy(screens: Screen[]): ScreenWithChildren[] {
  const screenMap = new Map<string, ScreenWithChildren>();
  const result: ScreenWithChildren[] = [];

  // First pass: create map with children arrays
  screens.forEach((screen) => {
    screenMap.set(screen.id, { ...screen, children: [], level: 0 });
  });

  // Second pass: build tree structure and calculate levels
  screens.forEach((screen) => {
    const node = screenMap.get(screen.id)!;
    if (screen.parent_id) {
      const parent = screenMap.get(screen.parent_id);
      if (parent) {
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        result.push(node);
      }
    } else {
      result.push(node);
    }
  });

  return result;
}

// Flatten hierarchy for rendering
function flattenHierarchy(screens: ScreenWithChildren[]): ScreenWithChildren[] {
  const result: ScreenWithChildren[] = [];
  
  function traverse(screen: ScreenWithChildren) {
    result.push(screen);
    screen.children.forEach((child) => traverse(child));
  }
  
  screens.forEach((screen) => traverse(screen));
  return result;
}

export function ScreenGallery({
  screens,
  onSelectScreen,
  onUploadScreenshot,
  onAddScreen,
  selectedScreenId,
}: ScreenGalleryProps) {
  const hierarchy = buildScreenHierarchy(screens);
  const flatScreens = flattenHierarchy(hierarchy);

  return (
    <div className="p-6">
      {screens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No screens yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add screens using the tree sidebar or upload screenshots directly
            </p>
            <Button onClick={onAddScreen}>
              <Plus className="h-4 w-4 mr-2" />
              Add first screen
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {flatScreens.map((screen, index) => {
            const isSelected = selectedScreenId === screen.id;
            const isChild = screen.level > 0;
            const prevScreen = index > 0 ? flatScreens[index - 1] : null;
            const isFirstChildInGroup = isChild && (!prevScreen || prevScreen.level === 0);

            return (
              <div key={screen.id} className="relative">
                {/* Arrow indicator for child screens */}
                {isChild && isFirstChildInGroup && (
                  <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    <div className="flex items-center gap-2 text-sm">
                      <CornerDownRight className="h-4 w-4" />
                      <span>Branches from parent screen</span>
                    </div>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}

                <div 
                  className={`transition-all ${
                    isChild ? "ml-8 md:ml-12" : ""
                  }`}
                >
                  <Card
                    key={screen.id}
                    className={`
                      group relative overflow-hidden cursor-pointer transition-all
                      hover:shadow-lg hover:scale-[1.02] inline-block
                      ${isSelected ? "ring-2 ring-primary" : ""}
                      ${isChild ? "border-l-4 border-l-primary/30" : ""}
                    `}
                    onClick={() => onSelectScreen?.(screen)}
                  >
                <div className="aspect-[9/16] relative bg-muted">
                  {screen.screenshot_url ? (
                    <Image
                      src={screen.screenshot_url}
                      alt={screen.title}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUploadScreenshot?.(screen.id);
                        }}
                        className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Upload className="h-8 w-8" />
                        <span className="text-xs">Upload</span>
                      </button>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUploadScreenshot?.(screen.id);
                      }}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </Button>
                  </div>
                    </div>
                    <div className="p-3 border-t">
                      <p className="text-sm font-medium truncate">{screen.title}</p>
                      {screen.path && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {screen.path}
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            );
          })}

          {/* Add screen card */}
          <div className="mt-6">
            <Card
              className="aspect-[9/16] w-full max-w-[280px] border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center"
              onClick={onAddScreen}
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Plus className="h-8 w-8" />
                <span className="text-sm">Add screen</span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
