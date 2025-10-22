"use client";

import Image from "next/image";
import { Plus, Upload, CornerDownRight, Edit2, Trash2 } from "lucide-react";
import type { Screen } from "@/lib/database.types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditScreenDialog } from "./edit-screen-dialog";
import { useState } from "react";

interface ScreenGalleryProps {
  screens: Screen[];
  onSelectScreen?: (screen: Screen) => void;
  onUploadScreenshot?: (screenId: string) => void;
  onAddScreen?: (parentId?: string) => void;
  onEdit?: (screen: Screen) => void;
  onDelete?: (screenId: string) => void;
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
  onEdit,
  onDelete,
}: {
  screen: Screen;
  isSelected: boolean;
  onSelectScreen?: (screen: Screen) => void;
  onUploadScreenshot?: (screenId: string) => void;
  onEdit?: (screen: Screen) => void;
  onDelete?: (screenId: string) => void;
}) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  return (
    <>
      <Card
        className={`
          group relative overflow-hidden cursor-pointer transition-all
          hover:shadow-lg hover:scale-[1.02]
          ${isSelected ? "ring-2 ring-primary" : ""}
        `}
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
      >
        <div className="aspect-[9/16] relative bg-muted">
          {screen.screenshot_url ? (
            <>
              <Image
                src={screen.screenshot_url}
                alt={screen.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                className="object-cover"
              />
            </>
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

          {/* Combined overlay with description and action buttons - always show on hover */}
          {showOverlay && (
            <div className="absolute inset-0 bg-black/70 flex flex-col justify-between p-4 rounded-lg z-10">
              {/* Action buttons at top */}
              <div className="flex justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditDialogOpen(true);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUploadScreenshot?.(screen.id);
                  }}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {screen.screenshot_url ? "Replace" : "Upload"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(screen.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Description at bottom */}
              {screen.notes && (
                <div className="flex items-end">
                  <p className="text-white text-sm leading-relaxed">
                    {screen.notes}
                  </p>
                </div>
              )}
            </div>
          )}
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

      {/* Edit Dialog */}
      {onUpdate && availableScreens && (
        <EditScreenDialog
          screen={screen}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdate={onUpdate}
          availableScreens={availableScreens}
        />
      )}
    </>
  );
}

export function ScreenGallery({
  screens,
  onSelectScreen,
  onUploadScreenshot,
  onAddScreen,
  onEdit,
  onDelete,
  selectedScreenId,
}: ScreenGalleryProps) {
  const { parents, childrenByParent } = groupScreensByParent(screens);

  return (
    <div className="p-6 min-w-0">
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
          {/* Parent screens in horizontal scrollable row */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {parents.map((screen) => (
              <div key={screen.id} className="flex-shrink-0 w-64">
                <ScreenCard
                  screen={screen}
                  isSelected={selectedScreenId === screen.id}
                  onSelectScreen={onSelectScreen}
                  onUploadScreenshot={onUploadScreenshot}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            ))}

            {/* Add screen card */}
            <div className="flex-shrink-0 w-64">
              <Card
                className="aspect-[9/16] border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center h-full"
                onClick={onAddScreen}
              >
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Plus className="h-8 w-8" />
                  <span className="text-sm">Add screen</span>
                </div>
              </Card>
            </div>
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
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {children.map((child) => (
                        <div key={child.id} className="flex-shrink-0 w-64">
                          <ScreenCard
                            screen={child}
                            isSelected={selectedScreenId === child.id}
                            onSelectScreen={onSelectScreen}
                            onUploadScreenshot={onUploadScreenshot}
                            onEdit={onEdit}
                            onDelete={onDelete}
                          />
                        </div>
                      ))}

                      {/* Add child screen card */}
                      <div className="flex-shrink-0 w-64">
                        <Card
                          className="aspect-[9/16] border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center h-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddScreen?.(parent.id);
                          }}
                        >
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Plus className="h-6 w-6" />
                            <span className="text-xs">Add child</span>
                          </div>
                        </Card>
                      </div>
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
