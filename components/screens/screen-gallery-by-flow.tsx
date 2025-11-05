"use client";

import Image from "next/image";
import { Plus, Upload, CornerDownRight } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import type { Screen, Flow } from "@/lib/database.types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScreenViewerModal } from "./screen-viewer-modal";

interface ScreenGalleryByFlowProps {
  flows: Flow[];
  screensByFlow: Map<string, Screen[]>;
  onSelectScreen?: (screen: Screen) => void;
  onUploadScreenshot?: (screenId: string) => void;
  onAddScreen?: (flowId: string, parentId?: string) => void;
  onEditScreen?: (screen: Screen) => void;
  onReorderScreens?: (flowId: string, screens: Screen[]) => void;
  onDeleteScreenshot?: (screenId: string) => Promise<void>;
  onArchiveScreen?: (screenId: string) => Promise<void>;
  selectedScreenId?: string;
  selectedFlowId?: string;
  readOnly?: boolean;
  platformType?: "web" | "ios" | "android";
}

// Screen Card Component - Mobbin style
function ScreenCard({
  screen,
  isSelected,
  onSelectScreen,
  onUploadScreenshot,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  readOnly,
  platformType = "ios",
}: {
  screen: Screen;
  isSelected: boolean;
  onSelectScreen?: (screen: Screen) => void;
  onUploadScreenshot?: (screenId: string) => void;
  isDragging?: boolean;
  onDragStart?: (screen: Screen) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent, screen: Screen) => void;
  onDrop?: (screen: Screen) => void;
  readOnly?: boolean;
  platformType?: "web" | "ios" | "android";
}) {
  const borderRadius = 27.195;

  // Calculate aspect ratio based on platform type
  // Web: 16:10 (62.5%), Mobile: 9:16 (216.2%)
  const paddingBottom =
    platformType === "web" ? "62.5%" : "216.19584119584127%";

  return (
    <div
      className="shrink-0"
      style={{ WebkitTouchCallout: "none" }}
      draggable={!readOnly}
      onDragStart={() => !readOnly && onDragStart?.(screen)}
      onDragEnd={() => !readOnly && onDragEnd?.()}
      onDragOver={(e) => {
        if (!readOnly) {
          e.preventDefault();
          onDragOver?.(e, screen);
        }
      }}
      onDrop={(e) => {
        if (!readOnly) {
          e.preventDefault();
          onDrop?.(screen);
        }
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom,
        }}
      >
        <div
          onClick={() => {
            onSelectScreen?.(screen);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectScreen?.(screen);
            }
          }}
          role="button"
          className={`
            group flex h-full w-full overflow-hidden 
            ${
              !readOnly
                ? "cursor-move hover:cursor-grab active:cursor-grabbing"
                : "cursor-zoom-in"
            }
            focus-visible:ring-4 focus-visible:ring-primary/50
            ${isSelected ? "ring-4 ring-primary/50" : ""}
            ${isDragging ? "opacity-50" : ""}
            transition-opacity
          `}
          style={{
            position: "absolute",
            inset: "0px",
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

                {/* Title and Description overlay on hover */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4 pointer-events-none"
                  style={{ borderRadius: `${borderRadius}px` }}
                >
                  {/* Title above description */}
                  <p className="text-white text-sm font-semibold mb-2">
                    {screen.display_name || screen.title}
                  </p>

                  {/* Description */}
                  {screen.notes && (
                    <p className="text-white text-sm leading-relaxed">
                      {screen.notes}
                    </p>
                  )}
                </div>

                {/* Upload button overlay */}
                {!screen.notes && (
                  <div
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
                    style={{ borderRadius: `${borderRadius}px` }}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      className="pointer-events-auto"
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
                className="absolute inset-0 flex items-center justify-center bg-muted pointer-events-none"
                style={{ borderRadius: `${borderRadius}px` }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  className="pointer-events-auto"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onUploadScreenshot?.(screen.id);
                  }}
                >
                  <Upload className="h-8 w-8 mb-1" />
                  <span className="text-xs">Upload</span>
                </Button>
              </div>
            )}
          </div>
        </div>
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
  onEditScreen,
  onReorderScreens,
  onDeleteScreenshot,
  onArchiveScreen,
  selectedScreenId,
  selectedFlowId,
  readOnly = false,
  platformType = "ios",
}: ScreenGalleryByFlowProps) {
  const [viewerScreen, setViewerScreen] = useState<Screen | null>(null);
  const [draggedScreen, setDraggedScreen] = useState<Screen | null>(null);
  const [dragOverScreen, setDragOverScreen] = useState<Screen | null>(null);

  // Get aspect ratio and width based on platform type
  // Web: 475px × 295px (16:10 ratio), Mobile: 256px with 9:16 ratio
  const aspectRatioClass =
    platformType === "web" ? "aspect-[16/10]" : "aspect-[9/16]";
  const widthClass = platformType === "web" ? "w-[475px]" : "w-64";

  const flowScrollStyle = {
    scrollMarginTop: "5rem",
    scrollMarginBottom: "3rem",
  };
  const cardScrollStyle = {
    scrollMarginTop: "6rem",
    scrollMarginBottom: "4rem",
    scrollMarginLeft: "2rem",
    scrollMarginRight: "2rem",
  };

  // Get all screens in order for the viewer
  const allScreensInOrder = useMemo(() => {
    const screens: Screen[] = [];
    flows.forEach((flow) => {
      const flowScreens = screensByFlow.get(flow.id) || [];
      screens.push(...flowScreens);
    });
    return screens;
  }, [flows, screensByFlow]);

  // Track if this is the initial load to prevent auto-scroll
  const hasScrolledRef = useRef(false);
  const initialFlowIdRef = useRef<string | undefined>(undefined);

  // Remember the initial selectedFlowId to skip auto-scroll for it
  useEffect(() => {
    if (initialFlowIdRef.current === undefined && selectedFlowId) {
      initialFlowIdRef.current = selectedFlowId;
    }
  }, [selectedFlowId]);

  // Scroll to selected screen when selectedScreenId changes (but not on initial load)
  useEffect(() => {
    if (!selectedScreenId) return;

    // Skip if this is the very first selection and we haven't scrolled yet
    if (!hasScrolledRef.current && initialFlowIdRef.current !== undefined) {
      return;
    }

    const element = document.getElementById(`screen-${selectedScreenId}`);
    if (element) {
      hasScrolledRef.current = true;
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [selectedScreenId]);

  useEffect(() => {
    if (!selectedFlowId || selectedScreenId) {
      return;
    }

    // Skip auto-scroll for the initial flow selection
    if (
      selectedFlowId === initialFlowIdRef.current &&
      !hasScrolledRef.current
    ) {
      return;
    }

    const element = document.getElementById(`flow-${selectedFlowId}`);

    if (!element) {
      return;
    }

    hasScrolledRef.current = true;
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }, [selectedFlowId, selectedScreenId]);

  const handleDragStart = (screen: Screen) => {
    setDraggedScreen(screen);
  };

  const handleDragEnd = () => {
    setDraggedScreen(null);
    setDragOverScreen(null);
  };

  const handleDragOver = (e: React.DragEvent, screen: Screen) => {
    e.preventDefault();
    setDragOverScreen(screen);
  };

  const handleDrop = (targetScreen: Screen) => {
    if (!draggedScreen || draggedScreen.id === targetScreen.id) {
      setDraggedScreen(null);
      setDragOverScreen(null);
      return;
    }

    const sourceFlowId = draggedScreen.flow_id;
    const targetFlowId = targetScreen.flow_id;

    if (sourceFlowId !== targetFlowId) {
      // TODO: Handle cross-flow drag (move screen to different flow)
      alert(
        "Moving screens between flows is not yet supported. Please use the sidebar for this."
      );
      setDraggedScreen(null);
      setDragOverScreen(null);
      return;
    }

    // Reorder within same flow
    const flowScreens = screensByFlow.get(sourceFlowId) || [];
    const draggedIndex = flowScreens.findIndex(
      (s) => s.id === draggedScreen.id
    );
    const targetIndex = flowScreens.findIndex((s) => s.id === targetScreen.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedScreen(null);
      setDragOverScreen(null);
      return;
    }

    const reorderedScreens = [...flowScreens];
    const [removed] = reorderedScreens.splice(draggedIndex, 1);
    reorderedScreens.splice(targetIndex, 0, removed);

    // Update order field
    const updatedScreens = reorderedScreens.map((screen, index) => ({
      ...screen,
      order: index,
    }));

    onReorderScreens?.(sourceFlowId, updatedScreens);

    setDraggedScreen(null);
    setDragOverScreen(null);
  };

  const handleScreenClick = (screen: Screen) => {
    setViewerScreen(screen);
    onSelectScreen?.(screen);
  };

  const handleCloseViewer = () => {
    setViewerScreen(null);
  };

  // Organize flows hierarchically (same as sidebar)
  // 1. Top-level flows (no parent_screen_id and no parent_flow_id)
  // 2. Child flows (have parent_flow_id)
  // 3. Branched flows (have parent_screen_id)
  const mainFlows = useMemo(
    () =>
      flows
        .filter((f) => !f.parent_screen_id && !f.parent_flow_id)
        .sort((a, b) => a.order_index - b.order_index),
    [flows]
  );

  const childFlowsByParent = useMemo(() => {
    const childFlows = flows.filter((f) => f.parent_flow_id);
    const map = new Map<string, Flow[]>();

    childFlows.forEach((flow) => {
      if (flow.parent_flow_id) {
        if (!map.has(flow.parent_flow_id)) {
          map.set(flow.parent_flow_id, []);
        }
        map.get(flow.parent_flow_id)!.push(flow);
      }
    });

    // Sort each group of child flows by order_index
    map.forEach((flows, parentId) => {
      map.set(
        parentId,
        flows.sort((a, b) => a.order_index - b.order_index)
      );
    });

    return map;
  }, [flows]);

  const branchedFlowsByParentScreen = useMemo(() => {
    const branchedFlows = flows.filter((f) => f.parent_screen_id);
    const map = new Map<string, Flow[]>();

    branchedFlows.forEach((flow) => {
      if (flow.parent_screen_id) {
        if (!map.has(flow.parent_screen_id)) {
          map.set(flow.parent_screen_id, []);
        }
        map.get(flow.parent_screen_id)!.push(flow);
      }
    });

    // Sort each group of branched flows by order_index
    map.forEach((flows, parentId) => {
      map.set(
        parentId,
        flows.sort((a, b) => a.order_index - b.order_index)
      );
    });

    return map;
  }, [flows]);

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

  // Recursive function to render a flow and its children
  const renderFlow = (flow: Flow) => {
    const screens = screensByFlow.get(flow.id) || [];
    const { parents, childrenByParent } = groupScreensByParent(screens);

    // Get parent flow if applicable
    const parentFlow = flow.parent_flow_id
      ? flows.find((f) => f.id === flow.parent_flow_id)
      : null;

    return (
      <>
        <div
          key={flow.id}
          id={`flow-${flow.id}`}
          className="space-y-6"
          style={flowScrollStyle}
        >
          {/* Flow Header */}
          <div className="flex items-center gap-3 border-b pb-3">
            <h3 className="text-lg text-primary">
              <span className="font-semibold">{flow.name}</span>
              {parentFlow && (
                <>
                  <span className="font-normal"> from </span>
                  <span className="font-semibold">{parentFlow.name}</span>
                </>
              )}
            </h3>
            <span className="text-sm text-muted-foreground">
              {screens.length} screen{screens.length !== 1 ? "s" : ""}
            </span>
          </div>

          {screens.length === 0 ? (
            /* Empty flow skeleton */
            <div className="flex gap-4 overflow-x-auto pb-4 pt-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className={`flex-shrink-0 ${widthClass}`}>
                <Card
                  className={`${aspectRatioClass} border-dashed border-muted-foreground/25 bg-muted/20 flex items-center justify-center`}
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8 opacity-50" />
                    <span className="text-sm opacity-50">No screens yet</span>
                  </div>
                </Card>
              </div>

              {/* Add screen card */}
              {!readOnly && (
                <div className={`flex-shrink-0 ${widthClass}`}>
                  <Card
                    className={`${aspectRatioClass} border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center h-full`}
                    onClick={() => onAddScreen?.(flow.id)}
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Plus className="h-8 w-8" />
                      <span className="text-sm">Add screen</span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Parent screens */}
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {parents.map((screen) => (
                  <div
                    key={screen.id}
                    id={`screen-${screen.id}`}
                    className={`flex-shrink-0 ${widthClass}`}
                    style={cardScrollStyle}
                  >
                    <ScreenCard
                      screen={screen}
                      isSelected={selectedScreenId === screen.id}
                      onSelectScreen={handleScreenClick}
                      onUploadScreenshot={onUploadScreenshot}
                      isDragging={draggedScreen?.id === screen.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      readOnly={readOnly}
                      platformType={platformType}
                    />
                  </div>
                ))}

                {/* Add screen card */}
                {!readOnly && (
                  <div className={`flex-shrink-0 ${widthClass}`}>
                    <Card
                      className={`${aspectRatioClass} border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center h-full`}
                      onClick={() => onAddScreen?.(flow.id)}
                    >
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Plus className="h-8 w-8" />
                        <span className="text-sm">Add screen</span>
                      </div>
                    </Card>
                  </div>
                )}
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
                                id={`screen-${child.id}`}
                                className={`flex-shrink-0 ${widthClass}`}
                                style={cardScrollStyle}
                              >
                                <ScreenCard
                                  screen={child}
                                  isSelected={selectedScreenId === child.id}
                                  onSelectScreen={handleScreenClick}
                                  onUploadScreenshot={onUploadScreenshot}
                                  isDragging={draggedScreen?.id === child.id}
                                  onDragStart={handleDragStart}
                                  onDragEnd={handleDragEnd}
                                  onDragOver={handleDragOver}
                                  onDrop={handleDrop}
                                  readOnly={readOnly}
                                />
                              </div>
                            ))}

                            {/* Add child screen card */}
                            {!readOnly && (
                              <div className={`flex-shrink-0 ${widthClass}`}>
                                <Card
                                  className={`${aspectRatioClass} border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center h-full`}
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
                            )}
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
                                <div className={`flex-shrink-0 ${widthClass}`}>
                                  <Card
                                    className={`${aspectRatioClass} border-dashed border-muted-foreground/25 bg-muted/20 flex items-center justify-center`}
                                  >
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                      <Upload className="h-8 w-8 opacity-50" />
                                      <span className="text-sm opacity-50">
                                        No screens yet
                                      </span>
                                    </div>
                                  </Card>
                                </div>

                                {/* Add screen card */}
                                {!readOnly && (
                                  <div
                                    className={`flex-shrink-0 ${widthClass}`}
                                  >
                                    <Card
                                      className={`${aspectRatioClass} border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center h-full`}
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
                                )}
                              </div>
                            ) : (
                              <>
                                {/* Parent screens in branched flow */}
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                  {branchedParents.map((screen) => (
                                    <div
                                      key={screen.id}
                                      id={`screen-${screen.id}`}
                                      className={`flex-shrink-0 ${widthClass}`}
                                      style={cardScrollStyle}
                                    >
                                      <ScreenCard
                                        screen={screen}
                                        isSelected={
                                          selectedScreenId === screen.id
                                        }
                                        onSelectScreen={handleScreenClick}
                                        onUploadScreenshot={onUploadScreenshot}
                                        isDragging={
                                          draggedScreen?.id === screen.id
                                        }
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        readOnly={readOnly}
                                      />
                                    </div>
                                  ))}

                                  {/* Add screen card */}
                                  {!readOnly && (
                                    <div
                                      className={`flex-shrink-0 ${widthClass}`}
                                    >
                                      <Card
                                        className={`${aspectRatioClass} border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center h-full`}
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
                                  )}
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
                                                id={`screen-${child.id}`}
                                                className={`flex-shrink-0 ${widthClass}`}
                                                style={cardScrollStyle}
                                              >
                                                <ScreenCard
                                                  screen={child}
                                                  isSelected={
                                                    selectedScreenId ===
                                                    child.id
                                                  }
                                                  onSelectScreen={
                                                    handleScreenClick
                                                  }
                                                  onUploadScreenshot={
                                                    onUploadScreenshot
                                                  }
                                                  isDragging={
                                                    draggedScreen?.id ===
                                                    child.id
                                                  }
                                                  onDragStart={handleDragStart}
                                                  onDragEnd={handleDragEnd}
                                                  onDragOver={handleDragOver}
                                                  onDrop={handleDrop}
                                                  readOnly={readOnly}
                                                />
                                              </div>
                                            ))}

                                            {/* Add child screen card */}
                                            {!readOnly && (
                                              <div
                                                className={`flex-shrink-0 ${widthClass}`}
                                              >
                                                <Card
                                                  className={`${aspectRatioClass} border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors flex items-center justify-center h-full`}
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
                                            )}
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
      </>
    );
  };

  return (
    <div className="p-6 space-y-12">
      {mainFlows.map((flow) => {
        const hasChildren = childFlowsByParent.has(flow.id);
        const children = childFlowsByParent.get(flow.id) || [];

        return (
          <div key={flow.id}>
            {renderFlow(flow)}
            {/* Render child flows recursively with indentation */}
            {hasChildren &&
              children.map((childFlow) => {
                const grandchildren =
                  childFlowsByParent.get(childFlow.id) || [];
                return (
                  <div
                    key={childFlow.id}
                    className="ml-8 border-l-2 border-primary/20 pl-6"
                  >
                    {renderFlow(childFlow)}
                    {/* Recursively render grandchildren (3rd level) with additional indentation */}
                    {grandchildren.length > 0 &&
                      grandchildren.map((grandchildFlow) => {
                        const greatgrandchildren =
                          childFlowsByParent.get(grandchildFlow.id) || [];
                        return (
                          <div
                            key={grandchildFlow.id}
                            className="ml-8 border-l-2 border-primary/20 pl-6"
                          >
                            {renderFlow(grandchildFlow)}
                            {/* Support 4th level if needed with additional indentation */}
                            {greatgrandchildren.length > 0 &&
                              greatgrandchildren.map((ggFlow) => (
                                <div
                                  key={ggFlow.id}
                                  className="ml-8 border-l-2 border-primary/20 pl-6"
                                >
                                  {renderFlow(ggFlow)}
                                </div>
                              ))}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
          </div>
        );
      })}

      {/* Full Screen Viewer Modal */}
      {viewerScreen && (
        <ScreenViewerModal
          screen={viewerScreen}
          allScreens={allScreensInOrder}
          onClose={handleCloseViewer}
          onNavigate={handleScreenClick}
          onEdit={onEditScreen}
          onUploadScreenshot={onUploadScreenshot}
          onDeleteScreenshot={onDeleteScreenshot}
          onArchiveScreen={onArchiveScreen}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
