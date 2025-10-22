"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Flow, Screen } from "@/lib/database.types";
import { FlowHeader } from "./flow-header";
import { FlowContent } from "./flow-content";
import { Button } from "@/components/ui/button";

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
  onReorderFlows?: (flows: Flow[]) => void;
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
  onReorderFlows,
  selectedScreenId,
  selectedFlowId,
}: FlowSidebarProps) {
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(
    new Set(flows.map((f) => f.id))
  );
  const [draggedScreen, setDraggedScreen] = useState<Screen | null>(null);
  const [dragTargetScreen, setDragTargetScreen] = useState<Screen | null>(null);
  const [draggedFlow, setDraggedFlow] = useState<Flow | null>(null);
  const [dragTargetFlow, setDragTargetFlow] = useState<Flow | null>(null);

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
      setDragTargetFlow(flow);
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

    // Reorder the flows array
    const reordered = [...flows];
    const draggedIndex = reordered.findIndex((f) => f.id === draggedFlow.id);
    const targetIndex = reordered.findIndex((f) => f.id === targetFlow.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedFlow(null);
      setDragTargetFlow(null);
      return;
    }

    // Remove dragged flow and insert at target position
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update order_index for all flows
    const flowsWithNewOrder = reordered.map((flow, index) => ({
      ...flow,
      order_index: index,
    }));

    // Call the reorder callback
    onReorderFlows(flowsWithNewOrder);

    setDraggedFlow(null);
    setDragTargetFlow(null);
  };

  // Organize flows hierarchically: main flows first, then branched flows
  const mainFlows = flows.filter((f) => !f.parent_screen_id);
  const branchedFlows = flows.filter((f) => f.parent_screen_id);

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

  return (
    <div className="w-full border-r bg-background h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b z-10 px-4 py-3 flex items-center justify-between">
        <h2 className="font-semibold text-sm text-foreground">Flow Tree</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-muted"
          onClick={onAddFlow}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Flows List */}
      <div className="py-2">
        {mainFlows.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p className="mb-2">No flows yet</p>
            <Button variant="outline" size="sm" onClick={onAddFlow}>
              <Plus className="h-3 w-3 mr-1" />
              Create first flow
            </Button>
          </div>
        ) : (
          mainFlows.map((flow) => {
            const screens = screensByFlow.get(flow.id) || [];
            const isExpanded = expandedFlows.has(flow.id);
            const isSelected = selectedFlowId === flow.id;
            const isDragged = draggedFlow?.id === flow.id;
            const isDragTarget = dragTargetFlow?.id === flow.id;

            return (
              <div key={flow.id}>
                <FlowHeader
                  flow={flow}
                  isExpanded={isExpanded}
                  isSelected={isSelected}
                  isDragged={isDragged}
                  isDragTarget={isDragTarget}
                  onToggle={() => toggleFlow(flow.id)}
                  onSelect={() => onSelectFlow?.(flow)}
                  onAddScreen={() => onAddScreen?.(flow.id)}
                  onDelete={() => {
                    if (
                      confirm(
                        `Delete flow "${flow.name}" and all its screens?`
                      )
                    ) {
                      onDeleteFlow?.(flow.id);
                    }
                  }}
                  onDragStart={() => handleFlowDragStart(flow)}
                  onDragOver={(e) => handleFlowDragOver(e, flow)}
                  onDragLeave={handleFlowDragLeave}
                  onDrop={(e) => handleFlowDrop(e, flow)}
                />

                <FlowContent
                  flow={flow}
                  screens={screens}
                  isExpanded={isExpanded}
                  branchedFlowsByParent={branchedFlowsByParent}
                  screensByFlow={screensByFlow}
                  expandedFlows={expandedFlows}
                  selectedScreenId={selectedScreenId}
                  selectedFlowId={selectedFlowId}
                  draggedScreen={draggedScreen}
                  onAddScreen={onAddScreen || (() => {})}
                  onSelectScreen={onSelectScreen || (() => {})}
                  onSelectFlow={onSelectFlow || (() => {})}
                  onUpdateScreenTitle={onUpdateScreenTitle || (() => {})}
                  onAddFlowFromScreen={onAddFlowFromScreen || (() => {})}
                  onDeleteScreen={onDeleteScreen || (() => {})}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onToggleFlow={toggleFlow}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}