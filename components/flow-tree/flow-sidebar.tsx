"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { Flow, Screen } from "@/lib/database.types";
import { TreeNode } from "./tree-node";
import { Button } from "@/components/ui/button";
import { buildScreenTree } from "@/lib/flows";

interface FlowSidebarProps {
  flows: Flow[];
  screensByFlow: Map<string, Screen[]>;
  onAddFlow?: () => void;
  onAddScreen?: (flowId: string, parentId?: string) => void;
  onSelectScreen?: (screen: Screen) => void;
  onSelectFlow?: (flow: Flow) => void;
  onUpdateScreenTitle?: (screenId: string, newTitle: string) => void;
  onAddFlowFromScreen?: (screenId: string) => void;
  onDeleteScreen?: (screenId: string) => void;
  onDeleteFlow?: (flowId: string) => void;
  onReorderScreens?: (flowId: string, screens: Screen[]) => void;
  selectedScreenId?: string;
  selectedFlowId?: string;
}

export function FlowSidebar({
  flows,
  screensByFlow,
  onAddFlow,
  onAddScreen,
  onSelectScreen,
  onSelectFlow,
  onUpdateScreenTitle,
  onAddFlowFromScreen,
  onDeleteScreen,
  onDeleteFlow,
  onReorderScreens,
  selectedScreenId,
  selectedFlowId,
}: FlowSidebarProps) {
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(
    new Set(flows.map((f) => f.id))
  );
  const [draggedScreen, setDraggedScreen] = useState<Screen | null>(null);
  const [dragTargetScreen, setDragTargetScreen] = useState<Screen | null>(null);

  const toggleFlow = (flowId: string) => {
    const newExpanded = new Set(expandedFlows);
    if (newExpanded.has(flowId)) {
      newExpanded.delete(flowId);
    } else {
      newExpanded.add(flowId);
    }
    setExpandedFlows(newExpanded);
  };

  const handleDragStart = (screen: Screen) => {
    setDraggedScreen(screen);
  };

  const handleDragOver = (screen: Screen) => {
    setDragTargetScreen(screen);
  };

  const handleDrop = (targetScreen: Screen) => {
    if (!draggedScreen || draggedScreen.id === targetScreen.id) {
      setDraggedScreen(null);
      setDragTargetScreen(null);
      return;
    }

    // Get all screens in the same flow
    const flowScreens = screensByFlow.get(draggedScreen.flow_id) || [];

    // Find the indices
    const draggedIndex = flowScreens.findIndex(
      (s) => s.id === draggedScreen.id
    );
    const targetIndex = flowScreens.findIndex((s) => s.id === targetScreen.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedScreen(null);
      setDragTargetScreen(null);
      return;
    }

    // Reorder the screens array
    const reordered = [...flowScreens];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Call the reorder callback with the new order
    onReorderScreens?.(draggedScreen.flow_id, reordered);

    setDraggedScreen(null);
    setDragTargetScreen(null);
  };

  return (
    <div className="w-80 border-r bg-background h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b z-10 p-3 flex items-center justify-between">
        <h2 className="font-semibold text-sm">Flow Tree</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onAddFlow}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Flows List */}
      <div className="p-2">
        {flows.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p className="mb-2">No flows yet</p>
            <Button variant="outline" size="sm" onClick={onAddFlow}>
              <Plus className="h-3 w-3 mr-1" />
              Create first flow
            </Button>
          </div>
        ) : (
          flows.map((flow) => {
            const screens = screensByFlow.get(flow.id) || [];
            const tree = buildScreenTree(screens);
            const isExpanded = expandedFlows.has(flow.id);

            return (
              <div key={flow.id} className="mb-2">
                {/* Flow Header */}
                <div
                  onClick={() => {
                    toggleFlow(flow.id);
                    onSelectFlow?.(flow);
                  }}
                  className={`w-full flex items-center gap-2 p-2 hover:bg-muted rounded-md group cursor-pointer transition-colors ${
                    selectedFlowId === flow.id
                      ? "bg-primary/10 ring-1 ring-primary/20 font-medium"
                      : ""
                  }`}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isExpanded ? "" : "-rotate-90"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium flex-1 text-left truncate ${
                      selectedFlowId === flow.id
                        ? "text-primary font-semibold"
                        : "text-primary"
                    }`}
                  >
                    {flow.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {flow.screen_count}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddScreen?.(flow.id);
                    }}
                    title="Add screen"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm(
                          `Delete flow "${flow.name}" and all its screens?`
                        )
                      ) {
                        onDeleteFlow?.(flow.id);
                      }
                    }}
                    title="Delete flow"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Screen Tree */}
                {isExpanded && (
                  <div className="mt-1">
                    {tree.length === 0 ? (
                      <div className="pl-8 py-2 text-xs text-muted-foreground">
                        No screens yet
                      </div>
                    ) : (
                      tree.map((screen) => (
                        <TreeNode
                          key={screen.id}
                          screen={screen}
                          onAddChild={(parentId) =>
                            onAddScreen?.(flow.id, parentId)
                          }
                          onSelect={onSelectScreen}
                          onUpdateTitle={onUpdateScreenTitle}
                          onAddFlowFromScreen={onAddFlowFromScreen}
                          onDelete={onDeleteScreen}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          selectedId={selectedScreenId}
                          isDragging={draggedScreen?.id === screen.id}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
