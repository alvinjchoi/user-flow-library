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

// Group screens by parent-child relationships
function groupScreensByParent(screens: Screen[]): {
  parents: Screen[];
  childrenByParent: Map<string, Screen[]>;
} {
  const parents: Screen[] = [];
  const childrenByParent = new Map<string, Screen[]>();

  screens.forEach((screen) => {
    if (!screen.parent_id) {
      parents.push(screen);
    } else {
      const siblings = childrenByParent.get(screen.parent_id) || [];
      siblings.push(screen);
      childrenByParent.set(screen.parent_id, siblings);
    }
  });

  return { parents, childrenByParent };
}

function ScreenCard({
  screen,
  isSelected,
  onSelectScreen,
  onUploadScreenshot,
}: {
  screen: Screen;
  isSelected: boolean;
  onSelectScreen?: (screen: Screen) => void;
  onUploadScreenshot?: (screenId: string) => void;
}) {
  return (
    <Card
      className={`
        group relative overflow-hidden cursor-pointer transition-all
        hover:shadow-lg hover:scale-[1.02]
        ${isSelected ? "ring-2 ring-primary" : ""}
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
  );
}

export function ScreenGallery({
  screens,
  onSelectScreen,
  onUploadScreenshot,
  onAddScreen,
  selectedScreenId,
}: ScreenGalleryProps) {
  const { parents, childrenByParent } = groupScreensByParent(screens);

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
        <div className="space-y-8">
          {/* Parent screens in grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {parents.map((screen) => (
              <ScreenCard
                key={screen.id}
                screen={screen}
                isSelected={selectedScreenId === screen.id}
                onSelectScreen={onSelectScreen}
                onUploadScreenshot={onUploadScreenshot}
              />
            ))}

            {/* Add screen card */}
            <Card
              className="aspect-[9/16] border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center"
              onClick={onAddScreen}
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Plus className="h-8 w-8" />
                <span className="text-sm">Add screen</span>
              </div>
            </Card>
          </div>

          {/* Child screens grouped by parent */}
          {parents.map((parent) => {
            const children = childrenByParent.get(parent.id);
            if (!children || children.length === 0) return null;

            return (
              <div key={`children-${parent.id}`} className="space-y-4">
                {/* Arrow indicator */}
                <div className="flex items-start gap-4">
                  <div className="w-[calc((100%/2)-0.5rem)] md:w-[calc((100%/3)-0.667rem)] lg:w-[calc((100%/4)-0.75rem)] xl:w-[calc((100%/5)-0.8rem)] flex flex-col items-center">
                    <div className="text-primary text-sm font-medium mb-2 text-center truncate w-full px-2">
                      {parent.title}
                    </div>
                    <CornerDownRight className="h-6 w-6 text-primary" />
                  </div>
                </div>

                {/* Child screens */}
                <div className="pl-8 md:pl-12">
                  <div className="border-l-2 border-primary/30 pl-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {children.map((child) => (
                        <ScreenCard
                          key={child.id}
                          screen={child}
                          isSelected={selectedScreenId === child.id}
                          onSelectScreen={onSelectScreen}
                          onUploadScreenshot={onUploadScreenshot}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
