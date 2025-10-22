"use client";

import Image from "next/image";
import { Plus, Upload, CornerDownRight } from "lucide-react";
import type { Screen, Flow } from "@/lib/database.types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ScreenGalleryByFlowProps {
  flows: Flow[];
  screensByFlow: Map<string, Screen[]>;
  onSelectScreen?: (screen: Screen) => void;
  onUploadScreenshot?: (screenId: string) => void;
  onAddScreen?: (flowId: string, parentId?: string) => void;
  selectedScreenId?: string;
}

// Screen Card Component - Mobbin style
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
  const borderRadius = 27.195;
  
  return (
    <div 
      className="shrink-0"
      style={{ WebkitTouchCallout: 'none' }}
    >
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        paddingBottom: '216.19584119584127%' 
      }}>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectScreen?.(screen);
          }}
          className={`
            group flex h-full w-full overflow-hidden 
            cursor-zoom-in
            focus-visible:ring-4 focus-visible:ring-primary/50
            ${isSelected ? "ring-4 ring-primary/50" : ""}
          `}
          style={{
            position: 'absolute',
            inset: '0px',
            borderRadius: `${borderRadius}px`,
          }}
          tabIndex={0}
        >
          <div className="grow relative">
            {screen.screenshot_url ? (
              <>
                <img
                  crossOrigin="anonymous"
                  src={screen.screenshot_url}
                  alt={screen.title}
                  className="h-full w-full object-cover object-top bg-muted"
                  style={{
                    borderRadius: `${borderRadius}px`,
                  }}
                />
                {/* Shadow overlay */}
                <div 
                  className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]"
                  style={{ borderRadius: `${borderRadius}px` }}
                />
                
                {/* Description overlay on hover */}
                {screen.notes && (
                  <div 
                    className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-4"
                    style={{ borderRadius: `${borderRadius}px` }}
                  >
                    <p className="text-white text-sm leading-relaxed">
                      {screen.notes}
                    </p>
                  </div>
                )}
                
                {/* Upload button overlay */}
                {!screen.notes && (
                  <div 
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ borderRadius: `${borderRadius}px` }}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onUploadScreenshot?.(screen.id);
                      }}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-muted"
                style={{ borderRadius: `${borderRadius}px` }}
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
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
          </div>
        </a>
      </div>
    </div>
  );
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

export function ScreenGalleryByFlow({
  flows,
  screensByFlow,
  onSelectScreen,
  onUploadScreenshot,
  onAddScreen,
  selectedScreenId,
}: ScreenGalleryByFlowProps) {
  console.log("ScreenGalleryByFlow - flows:", flows);
  console.log("ScreenGalleryByFlow - screensByFlow:", screensByFlow);

  // Separate main flows from branched flows
  const mainFlows = flows.filter((f) => !f.parent_screen_id);
  const branchedFlows = flows.filter((f) => f.parent_screen_id);

  // Group branched flows by their parent screen
  const branchedFlowsByParentScreen = new Map<string, Flow[]>();
  branchedFlows.forEach((flow) => {
    if (flow.parent_screen_id) {
      if (!branchedFlowsByParentScreen.has(flow.parent_screen_id)) {
        branchedFlowsByParentScreen.set(flow.parent_screen_id, []);
      }
      branchedFlowsByParentScreen.get(flow.parent_screen_id)!.push(flow);
    }
  });

  if (mainFlows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No flows yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a flow to start organizing your screens
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-12">
      {mainFlows.map((flow) => {
        const screens = screensByFlow.get(flow.id) || [];
        console.log(`Flow "${flow.name}" - screens:`, screens);
        const { parents, childrenByParent } = groupScreensByParent(screens);

        return (
          <div key={flow.id} className="space-y-6">
            {/* Flow Header */}
            <div className="flex items-center gap-3 border-b pb-3">
              <h3 className="text-lg font-semibold text-primary">
                {flow.name}
              </h3>
              <span className="text-sm text-muted-foreground">
                {screens.length} screen{screens.length !== 1 ? "s" : ""}
              </span>
            </div>

            {screens.length === 0 ? (
              /* Empty flow skeleton */
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="flex-shrink-0 w-64">
                  <Card className="aspect-[9/16] border-dashed border-muted-foreground/25 bg-muted/20 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8 opacity-50" />
                      <span className="text-sm opacity-50">No screens yet</span>
                    </div>
                  </Card>
                </div>

                {/* Add screen card */}
                <div className="flex-shrink-0 w-64">
                  <Card
                    className="aspect-[9/16] border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center h-full"
                    onClick={() => onAddScreen?.(flow.id)}
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Plus className="h-8 w-8" />
                      <span className="text-sm">Add screen</span>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <>
                {/* Parent screens */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {parents.map((screen) => (
                    <div key={screen.id} className="flex-shrink-0 w-64">
                      <ScreenCard
                        screen={screen}
                        isSelected={selectedScreenId === screen.id}
                        onSelectScreen={onSelectScreen}
                        onUploadScreenshot={onUploadScreenshot}
                      />
                    </div>
                  ))}

                  {/* Add screen card */}
                  <div className="flex-shrink-0 w-64">
                    <Card
                      className="aspect-[9/16] border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center h-full"
                      onClick={() => onAddScreen?.(flow.id)}
                    >
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Plus className="h-8 w-8" />
                        <span className="text-sm">Add screen</span>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Child screens and branched flows */}
                {parents.map((parent) => {
                  const children = childrenByParent.get(parent.id);
                  const branchedFlowsForThisParent =
                    branchedFlowsByParentScreen.get(parent.id) || [];
                  const hasChildrenOrBranchedFlows =
                    (children && children.length > 0) ||
                    branchedFlowsForThisParent.length > 0;

                  if (!hasChildrenOrBranchedFlows) return null;

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

                      {/* Child screens grid */}
                      {children && children.length > 0 && (
                        <div className="pl-8 md:pl-12">
                          <div className="border-l-2 border-primary/30 pl-4">
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                              {children.map((child) => (
                                <div
                                  key={child.id}
                                  className="flex-shrink-0 w-64"
                                >
                                  <ScreenCard
                                    screen={child}
                                    isSelected={selectedScreenId === child.id}
                                    onSelectScreen={onSelectScreen}
                                    onUploadScreenshot={onUploadScreenshot}
                                  />
                                </div>
                              ))}

                              {/* Add child screen card */}
                              <div className="flex-shrink-0 w-64">
                                <Card
                                  className="aspect-[9/16] border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center h-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddScreen?.(flow.id, parent.id);
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
                      )}

                      {/* Branched flows stemming from this parent */}
                      {branchedFlowsForThisParent.map((branchedFlow) => {
                        const branchedScreens =
                          screensByFlow.get(branchedFlow.id) || [];
                        const {
                          parents: branchedParents,
                          childrenByParent: branchedChildrenByParent,
                        } = groupScreensByParent(branchedScreens);

                        return (
                          <div
                            key={`branched-${branchedFlow.id}`}
                            className="pl-8 md:pl-12"
                          >
                            <div className="border-l-2 border-primary/30 pl-4 space-y-4">
                              {/* Branched flow header */}
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-semibold text-primary/90">
                                  {branchedFlow.name}
                                </h4>
                                <span className="text-xs text-muted-foreground">
                                  from {parent.title}
                                </span>
                              </div>

                              {/* Branched flow screens */}
                              {branchedScreens.length === 0 ? (
                                /* Empty branched flow skeleton */
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                  <div className="flex-shrink-0 w-64">
                                    <Card className="aspect-[9/16] border-dashed border-muted-foreground/25 bg-muted/20 flex items-center justify-center">
                                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Upload className="h-8 w-8 opacity-50" />
                                        <span className="text-sm opacity-50">
                                          No screens yet
                                        </span>
                                      </div>
                                    </Card>
                                  </div>

                                  {/* Add screen card */}
                                  <div className="flex-shrink-0 w-64">
                                    <Card
                                      className="aspect-[9/16] border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center h-full"
                                      onClick={() =>
                                        onAddScreen?.(branchedFlow.id)
                                      }
                                    >
                                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Plus className="h-8 w-8" />
                                        <span className="text-sm">
                                          Add screen
                                        </span>
                                      </div>
                                    </Card>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Parent screens in branched flow */}
                                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                    {branchedParents.map((screen) => (
                                      <div
                                        key={screen.id}
                                        className="flex-shrink-0 w-64"
                                      >
                                        <ScreenCard
                                          screen={screen}
                                          isSelected={
                                            selectedScreenId === screen.id
                                          }
                                          onSelectScreen={onSelectScreen}
                                          onUploadScreenshot={
                                            onUploadScreenshot
                                          }
                                        />
                                      </div>
                                    ))}

                                    {/* Add screen card */}
                                    <div className="flex-shrink-0 w-64">
                                      <Card
                                        className="aspect-[9/16] border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center h-full"
                                        onClick={() =>
                                          onAddScreen?.(branchedFlow.id)
                                        }
                                      >
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                          <Plus className="h-8 w-8" />
                                          <span className="text-sm">
                                            Add screen
                                          </span>
                                        </div>
                                      </Card>
                                    </div>
                                  </div>

                                  {/* Child screens within branched flow */}
                                  {branchedParents.map((branchedParent) => {
                                    const branchedChildren =
                                      branchedChildrenByParent.get(
                                        branchedParent.id
                                      );
                                    if (
                                      !branchedChildren ||
                                      branchedChildren.length === 0
                                    )
                                      return null;

                                    return (
                                      <div
                                        key={`branched-children-${branchedParent.id}`}
                                        className="space-y-4"
                                      >
                                        {/* Arrow indicator for branched flow children */}
                                        <div className="flex items-start gap-4">
                                          <div className="w-[calc((100%/2)-0.5rem)] md:w-[calc((100%/3)-0.667rem)] lg:w-[calc((100%/4)-0.75rem)] xl:w-[calc((100%/5)-0.8rem)] flex flex-col items-center">
                                            <div className="text-primary text-sm font-medium mb-2 text-center truncate w-full px-2">
                                              {branchedParent.title}
                                            </div>
                                            <CornerDownRight className="h-6 w-6 text-primary" />
                                          </div>
                                        </div>

                                        {/* Branched flow child screens grid */}
                                        <div className="pl-8 md:pl-12">
                                          <div className="border-l-2 border-primary/30 pl-4">
                                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                              {branchedChildren.map((child) => (
                                                <div
                                                  key={child.id}
                                                  className="flex-shrink-0 w-64"
                                                >
                                                  <ScreenCard
                                                    screen={child}
                                                    isSelected={
                                                      selectedScreenId ===
                                                      child.id
                                                    }
                                                    onSelectScreen={
                                                      onSelectScreen
                                                    }
                                                    onUploadScreenshot={
                                                      onUploadScreenshot
                                                    }
                                                  />
                                                </div>
                                              ))}

                                              {/* Add child screen card */}
                                              <div className="flex-shrink-0 w-64">
                                                <Card
                                                  className="aspect-[9/16] border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center h-full"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddScreen?.(
                                                      branchedFlow.id,
                                                      branchedParent.id
                                                    );
                                                  }}
                                                >
                                                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Plus className="h-6 w-6" />
                                                    <span className="text-xs">
                                                      Add child
                                                    </span>
                                                  </div>
                                                </Card>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
