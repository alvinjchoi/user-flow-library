"use client";

import { useState } from "react";
import { Plus, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import type { Flow, Screen } from "@/lib/database.types";
import { FlowItem } from "./flow-item";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FlowSidebarProps {
  flows: Flow[];
  screensByFlow: Map<string, Screen[]>;
  onAddFlow?: (parentFlowId?: string) => void;
  onAddScreen?: (flowId: string, parentId?: string) => void;
  onSelectScreen?: (screen: Screen) => void;
  onSelectFlow?: (flow: Flow) => void;
  onUpdateScreenTitle?: (screenId: string, newTitle: string) => void;
  onUpdateFlowName?: (flowId: string, newName: string) => void;
  onAddFlowFromScreen?: (screenId: string) => void;
  onDeleteScreen?: (screenId: string) => void;
  onDeleteFlow?: (flowId: string) => void;
  onReorderScreens?: (flowId: string, screens: Screen[]) => void;
  onReorderFlows?: (flows: Flow[]) => void;
  onMoveFlowToScreen?: (flowId: string, screenId: string | null) => void;
  onMoveFlow?: (
    flowId: string,
    targetId: string | null,
    targetType: "screen" | "flow" | "top-level"
  ) => void;
  selectedScreenId?: string;
  selectedFlowId?: string;
  readOnly?: boolean;
}

export function FlowSidebar({
  flows,
  screensByFlow,
  onAddFlow,
  onAddScreen,
  onSelectScreen,
  onSelectFlow,
  onUpdateScreenTitle,
  onUpdateFlowName,
  onAddFlowFromScreen,
  onDeleteScreen,
  onDeleteFlow,
  onReorderScreens,
  onReorderFlows,
  onMoveFlowToScreen,
  onMoveFlow,
  selectedScreenId,
  selectedFlowId,
  readOnly = false,
}: FlowSidebarProps) {
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(
    new Set(flows.map((f) => f.id))
  );
  const [draggedScreen, setDraggedScreen] = useState<Screen | null>(null);
  const [dragTargetScreen, setDragTargetScreen] = useState<Screen | null>(null);
  const [draggedFlow, setDraggedFlow] = useState<Flow | null>(null);
  const [dragTargetFlow, setDragTargetFlow] = useState<Flow | null>(null);
  const [dragTargetScreenForFlow, setDragTargetScreenForFlow] =
    useState<Screen | null>(null);
  const [dragTargetFlowForFlow, setDragTargetFlowForFlow] =
    useState<Flow | null>(null);

  const toggleFlow = (flowId: string) => {
    const newExpanded = new Set(expandedFlows);

    if (newExpanded.has(flowId)) {
      // Collapsing: remove this flow and all its descendants
      newExpanded.delete(flowId);

      // Find all descendant flows recursively and collapse them too
      const collapseDescendants = (parentFlowId: string) => {
        const children = flows.filter((f) => f.parent_flow_id === parentFlowId);
        children.forEach((child) => {
          newExpanded.delete(child.id);
          collapseDescendants(child.id); // Recursive
        });
      };

      collapseDescendants(flowId);
    } else {
      // Expanding: just expand this flow
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

  const handleDragLeave = () => {
    setDragTargetScreen(null);
  };

  const handleDrop = (targetScreen: Screen) => {
    if (!draggedScreen || !onReorderScreens) {
      setDraggedScreen(null);
      setDragTargetScreen(null);
      return;
    }

    if (draggedScreen.id === targetScreen.id) {
      setDraggedScreen(null);
      setDragTargetScreen(null);
      return;
    }

    // Find the flow for the dragged screen
    const draggedFlow = flows.find((f) =>
      screensByFlow.get(f.id)?.some((s) => s.id === draggedScreen.id)
    );

    if (!draggedFlow) {
      setDraggedScreen(null);
      setDragTargetScreen(null);
      return;
    }

    // Get all screens in the flow
    const flowScreens = screensByFlow.get(draggedFlow.id) || [];
    const reordered = [...flowScreens];
    const draggedIndex = reordered.findIndex((s) => s.id === draggedScreen.id);
    const targetIndex = reordered.findIndex((s) => s.id === targetScreen.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedScreen(null);
      setDragTargetScreen(null);
      return;
    }

    // Remove dragged screen and insert at target position
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update order_index for all screens
    const screensWithNewOrder = reordered.map((screen, index) => ({
      ...screen,
      order_index: index,
    }));

    // Call the reorder callback
    onReorderScreens(draggedFlow.id, screensWithNewOrder);

    setDraggedScreen(null);
    setDragTargetScreen(null);
  };

  // Flow drag handlers
  const handleFlowDragStart = (flow: Flow) => {
    setDraggedFlow(flow);
  };

  const handleFlowDragOver = (e: React.DragEvent, flow: Flow) => {
    e.preventDefault();
    if (draggedFlow && draggedFlow.id !== flow.id) {
      // Check if both are top-level flows for reordering
      const draggedIsTopLevel =
        !draggedFlow.parent_screen_id && !draggedFlow.parent_flow_id;
      const targetIsTopLevel = !flow.parent_screen_id && !flow.parent_flow_id;

      // Show visual feedback for top-level flow reordering
      if (draggedIsTopLevel && targetIsTopLevel) {
        setDragTargetFlow(flow);
      }
    }
  };

  const handleFlowDragLeave = () => {
    setDragTargetFlow(null);
  };

  const handleFlowDrop = (e: React.DragEvent, targetFlow: Flow) => {
    e.preventDefault();

    if (!draggedFlow || !onReorderFlows) {
      setDraggedFlow(null);
      setDragTargetFlow(null);
      return;
    }

    if (draggedFlow.id === targetFlow.id) {
      setDraggedFlow(null);
      setDragTargetFlow(null);
      return;
    }

    // Check if both flows are top-level (for drag-and-drop reordering)
    const draggedIsTopLevel =
      !draggedFlow.parent_screen_id && !draggedFlow.parent_flow_id;
    const targetIsTopLevel =
      !targetFlow.parent_screen_id && !targetFlow.parent_flow_id;

    // Only allow reordering among top-level flows
    if (draggedIsTopLevel && targetIsTopLevel) {
      // Get only top-level flows
      const topLevelFlows = flows
        .filter((f) => !f.parent_screen_id && !f.parent_flow_id)
        .sort((a, b) => a.order_index - b.order_index);

      const draggedIndex = topLevelFlows.findIndex(
        (f) => f.id === draggedFlow.id
      );
      const targetIndex = topLevelFlows.findIndex(
        (f) => f.id === targetFlow.id
      );

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedFlow(null);
        setDragTargetFlow(null);
        return;
      }

      // Reorder within top-level flows
      const reordered = [...topLevelFlows];
      const [removed] = reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, removed);

      // Update order_index for reordered top-level flows only
      const flowsWithNewOrder = reordered.map((flow, index) => ({
        ...flow,
        order_index: index,
      }));

      // Call the reorder callback
      onReorderFlows(flowsWithNewOrder);
    }

    setDraggedFlow(null);
    setDragTargetFlow(null);
  };

  // Organize flows hierarchically:
  // 1. Top-level flows (no parent_screen_id and no parent_flow_id)
  // 2. Child flows (have parent_flow_id)
  // 3. Branched flows (have parent_screen_id)
  const mainFlows = flows.filter(
    (f) => !f.parent_screen_id && !f.parent_flow_id
  );
  const branchedFlows = flows.filter((f) => f.parent_screen_id);
  const childFlows = flows.filter((f) => f.parent_flow_id);

  // Group branched flows by their parent screen
  const branchedFlowsByParent = new Map<string, Flow[]>();
  branchedFlows.forEach((flow) => {
    if (flow.parent_screen_id) {
      if (!branchedFlowsByParent.has(flow.parent_screen_id)) {
        branchedFlowsByParent.set(flow.parent_screen_id, []);
      }
      branchedFlowsByParent.get(flow.parent_screen_id)!.push(flow);
    }
  });

  // Sort each group of branched flows by order_index
  branchedFlowsByParent.forEach((flows, parentId) => {
    branchedFlowsByParent.set(
      parentId,
      flows.sort((a, b) => a.order_index - b.order_index)
    );
  });

  // Group child flows by their parent flow
  const childFlowsByParent = new Map<string, Flow[]>();
  childFlows.forEach((flow) => {
    if (flow.parent_flow_id) {
      if (!childFlowsByParent.has(flow.parent_flow_id)) {
        childFlowsByParent.set(flow.parent_flow_id, []);
      }
      childFlowsByParent.get(flow.parent_flow_id)!.push(flow);
    }
  });

  // Sort each group of child flows by order_index
  childFlowsByParent.forEach((flows, parentId) => {
    childFlowsByParent.set(
      parentId,
      flows.sort((a, b) => a.order_index - b.order_index)
    );
  });

  // Collect all screens from all flows
  const allScreens: Screen[] = [];
  screensByFlow.forEach((screens) => {
    allScreens.push(...screens);
  });

  // Move flow up in order
  const handleMoveFlowUp = (flowId: string) => {
    const index = mainFlows.findIndex((f) => f.id === flowId);
    if (index <= 0) return; // Can't move up if first

    const reordered = [...mainFlows];
    [reordered[index - 1], reordered[index]] = [
      reordered[index],
      reordered[index - 1],
    ];

    const flowsWithNewOrder = reordered.map((flow, idx) => ({
      ...flow,
      order_index: idx,
    }));

    onReorderFlows?.(flowsWithNewOrder);
  };

  // Move flow down in order
  const handleMoveFlowDown = (flowId: string) => {
    const index = mainFlows.findIndex((f) => f.id === flowId);
    if (index === -1 || index >= mainFlows.length - 1) return; // Can't move down if last

    const reordered = [...mainFlows];
    [reordered[index], reordered[index + 1]] = [
      reordered[index + 1],
      reordered[index],
    ];

    const flowsWithNewOrder = reordered.map((flow, idx) => ({
      ...flow,
      order_index: idx,
    }));

    onReorderFlows?.(flowsWithNewOrder);
  };

  // Collapse all flows
  const handleCollapseAll = () => {
    setExpandedFlows(new Set());
  };

  // Expand all flows
  const handleExpandAll = () => {
    const allFlowIds = new Set(flows.map((f) => f.id));
    setExpandedFlows(allFlowIds);
  };

  // Toggle between expand all and collapse all
  const handleToggleAll = () => {
    if (expandedFlows.size > 0) {
      handleCollapseAll();
    } else {
      handleExpandAll();
    }
  };

  const allExpanded = expandedFlows.size > 0;

  return (
    <div className="w-full border-r bg-background h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b z-10 px-4 py-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm text-foreground">Flow Tree</h2>
        <div className="flex items-center gap-2">
          {flows.length > 0 && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs h-6 px-2"
              onClick={handleToggleAll}
            >
              {allExpanded ? (
                <>
                  <ChevronsDownUp className="h-3 w-3 mr-1" />
                  Collapse all
                </>
              ) : (
                <>
                  <ChevronsUpDown className="h-3 w-3 mr-1" />
                  Expand all
                </>
              )}
            </Badge>
          )}
          {!readOnly && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-muted"
            onClick={() => onAddFlow?.()}
          >
            <Plus className="h-4 w-4" />
          </Button>
          )}
        </div>
      </div>

      {/* Flows List */}
      <div className="py-2">
        {mainFlows.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p className="mb-2">No flows yet</p>
            {!readOnly && (
            <Button variant="outline" size="sm" onClick={() => onAddFlow?.()}>
              <Plus className="h-3 w-3 mr-1" />
              Create first flow
            </Button>
            )}
          </div>
        ) : (
          mainFlows.map((flow, index) => (
            <FlowItem
              key={flow.id}
              flow={flow}
              flows={flows}
              screensByFlow={screensByFlow}
              branchedFlowsByParent={branchedFlowsByParent}
              childFlowsByParent={childFlowsByParent}
              expandedFlows={expandedFlows}
              selectedScreenId={selectedScreenId}
              selectedFlowId={selectedFlowId}
              draggedScreen={draggedScreen}
              draggedFlow={draggedFlow}
              dragTargetFlow={dragTargetFlow}
              dragTargetScreenForFlow={dragTargetScreenForFlow}
              dragTargetFlowForFlow={dragTargetFlowForFlow}
              allScreens={allScreens}
              onToggleFlow={toggleFlow}
              onSelectFlow={onSelectFlow || (() => {})}
              onSelectScreen={onSelectScreen || (() => {})}
              onAddFlow={onAddFlow}
              onAddScreen={onAddScreen || (() => {})}
              onUpdateScreenTitle={onUpdateScreenTitle || (() => {})}
              onUpdateFlowName={onUpdateFlowName}
              onAddFlowFromScreen={onAddFlowFromScreen || (() => {})}
              onDeleteScreen={onDeleteScreen || (() => {})}
              onDeleteFlow={onDeleteFlow || (() => {})}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onFlowDragStart={handleFlowDragStart}
              onFlowDragOver={handleFlowDragOver}
              onFlowDragLeave={handleFlowDragLeave}
              onFlowDrop={handleFlowDrop}
              onMoveFlowToScreen={onMoveFlowToScreen || (() => {})}
              onMoveFlow={onMoveFlow || (() => {})}
              onFlowDragOverScreen={(screen) =>
                setDragTargetScreenForFlow(screen)
              }
              onFlowDragLeaveScreen={() => setDragTargetScreenForFlow(null)}
              setDragTargetFlowForFlow={setDragTargetFlowForFlow}
              onReorderFlows={onReorderFlows}
              canMoveUp={index > 0}
              canMoveDown={index < mainFlows.length - 1}
              onMoveUp={() => handleMoveFlowUp(flow.id)}
              onMoveDown={() => handleMoveFlowDown(flow.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
