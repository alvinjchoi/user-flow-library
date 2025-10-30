"use client";

import type { Flow, Screen } from "@/lib/database.types";
import { FlowHeader } from "./flow-header";
import { FlowContent } from "./flow-content";

interface FlowItemProps {
  flow: Flow;
  flows: Flow[];
  screensByFlow: Map<string, Screen[]>;
  branchedFlowsByParent: Map<string, Flow[]>;
  childFlowsByParent: Map<string, Flow[]>;
  expandedFlows: Set<string>;
  selectedScreenId?: string;
  selectedFlowId?: string;
  draggedScreen?: Screen | null;
  draggedFlow?: Flow | null;
  dragTargetFlow?: Flow | null;
  dragTargetScreenForFlow?: Screen | null;
  dragTargetFlowForFlow?: Flow | null;
  allScreens: Screen[];
  onToggleFlow: (flowId: string) => void;
  onSelectFlow: (flow: Flow) => void;
  onSelectScreen: (screen: Screen) => void;
  onAddFlow?: (parentFlowId?: string) => void;
  onAddScreen: (flowId: string, parentId?: string) => void;
  onUpdateScreenTitle: (screenId: string, newTitle: string) => void;
  onUpdateFlowName?: (flowId: string, newName: string) => void;
  onAddFlowFromScreen: (screenId: string) => void;
  onDeleteScreen: (screenId: string) => void;
  onDeleteFlow: (flowId: string) => void;
  onDragStart: (screen: Screen) => void;
  onDragOver: (screen: Screen) => void;
  onDrop: (screen: Screen) => void;
  onFlowDragStart: (flow: Flow) => void;
  onFlowDragOver: (e: React.DragEvent, flow: Flow) => void;
  onFlowDragLeave: () => void;
  onFlowDrop: (e: React.DragEvent, flow: Flow) => void;
  onMoveFlowToScreen: (flowId: string, screenId: string | null) => void;
  onMoveFlow: (
    flowId: string,
    targetId: string | null,
    targetType: "screen" | "flow" | "top-level"
  ) => void;
  onFlowDragOverScreen: (screen: Screen) => void;
  onFlowDragLeaveScreen: () => void;
  setDragTargetFlowForFlow: (flow: Flow | null) => void;
  onReorderFlows?: (flows: Flow[]) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function FlowItem({
  flow,
  flows,
  screensByFlow,
  branchedFlowsByParent,
  childFlowsByParent,
  expandedFlows,
  selectedScreenId,
  selectedFlowId,
  draggedScreen,
  draggedFlow,
  dragTargetFlow,
  dragTargetScreenForFlow,
  dragTargetFlowForFlow,
  allScreens,
  onToggleFlow,
  onSelectFlow,
  onSelectScreen,
  onAddFlow,
  onAddScreen,
  onUpdateScreenTitle,
  onUpdateFlowName,
  onAddFlowFromScreen,
  onDeleteScreen,
  onDeleteFlow,
  onDragStart,
  onDragOver,
  onDrop,
  onFlowDragStart,
  onFlowDragOver,
  onFlowDragLeave,
  onFlowDrop,
  onMoveFlowToScreen,
  onMoveFlow,
  onFlowDragOverScreen,
  onFlowDragLeaveScreen,
  setDragTargetFlowForFlow,
  onReorderFlows,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: FlowItemProps) {
  const screens = screensByFlow.get(flow.id) || [];
  const isExpanded = expandedFlows.has(flow.id);
  const isSelected = selectedFlowId === flow.id;
  const isDragged = draggedFlow?.id === flow.id;
  const isDragTarget = dragTargetFlow?.id === flow.id;
  const isFlowDragTarget = dragTargetFlowForFlow?.id === flow.id;
  const hasScreenshots = screens.some((screen) => screen.screenshot_url);

  // Get child flows for this flow
  const childFlows = childFlowsByParent.get(flow.id) || [];

  // Create move up/down handlers for child flows
  const handleChildMoveUp = (childFlowId: string) => {
    const index = childFlows.findIndex((f) => f.id === childFlowId);
    if (index <= 0) return; // Can't move up if first

    const reordered = [...childFlows];
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

  const handleChildMoveDown = (childFlowId: string) => {
    const index = childFlows.findIndex((f) => f.id === childFlowId);
    if (index === -1 || index >= childFlows.length - 1) return; // Can't move down if last

    const reordered = [...childFlows];
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

  return (
    <div>
      <FlowHeader
        flow={flow}
        isExpanded={isExpanded}
        isSelected={isSelected}
        isDragged={isDragged}
        isDragTarget={isDragTarget}
        isFlowDragTarget={isFlowDragTarget}
        hasScreenshots={hasScreenshots}
        screenCount={screens.length}
        onToggle={() => onToggleFlow(flow.id)}
        onSelect={() => onSelectFlow(flow)}
        onAddScreen={() => onAddScreen(flow.id)}
        onAddFlow={onAddFlow}
        onDelete={() => {
          if (confirm(`Delete flow "${flow.name}" and all its screens?`)) {
            onDeleteFlow(flow.id);
          }
        }}
        onUpdateFlowName={onUpdateFlowName}
        onDragStart={() => onFlowDragStart(flow)}
        onDragOver={(e) => onFlowDragOver(e, flow)}
        onDragLeave={onFlowDragLeave}
        onDrop={(e) => onFlowDrop(e, flow)}
        onFlowDragOver={(e) => {
          e.preventDefault();
          if (draggedFlow && draggedFlow.id !== flow.id) {
            setDragTargetFlowForFlow(flow);
          }
        }}
        onFlowDrop={(e) => {
          e.preventDefault();
          if (draggedFlow && draggedFlow.id !== flow.id) {
            onMoveFlowToScreen(draggedFlow.id, `flow:${flow.id}`);
          }
          setDragTargetFlowForFlow(null);
        }}
        allScreens={allScreens}
        allFlows={flows}
        onMoveFlow={onMoveFlow}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />

      {/* Hide screens in sidebar - only show flows */}
      {/* <FlowContent ... /> */}

      {/* Recursively render child flows - only when parent is expanded */}
      {isExpanded && childFlowsByParent.has(flow.id) && (
        <div className="border-l-2 border-primary/20 ml-4 pl-2 bg-muted/5">
          {childFlowsByParent.get(flow.id)!.map((childFlow, index) => (
            <FlowItem
              key={childFlow.id}
              flow={childFlow}
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
              onToggleFlow={onToggleFlow}
              onSelectFlow={onSelectFlow}
              onSelectScreen={onSelectScreen}
              onAddFlow={onAddFlow}
              onAddScreen={onAddScreen}
              onUpdateScreenTitle={onUpdateScreenTitle}
              onUpdateFlowName={onUpdateFlowName}
              onAddFlowFromScreen={onAddFlowFromScreen}
              onDeleteScreen={onDeleteScreen}
              onDeleteFlow={onDeleteFlow}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onFlowDragStart={onFlowDragStart}
              onFlowDragOver={onFlowDragOver}
              onFlowDragLeave={onFlowDragLeave}
              onFlowDrop={onFlowDrop}
              onMoveFlowToScreen={onMoveFlowToScreen}
              onMoveFlow={onMoveFlow}
              onFlowDragOverScreen={onFlowDragOverScreen}
              onFlowDragLeaveScreen={onFlowDragLeaveScreen}
              setDragTargetFlowForFlow={setDragTargetFlowForFlow}
              onReorderFlows={onReorderFlows}
              canMoveUp={index > 0}
              canMoveDown={index < childFlows.length - 1}
              onMoveUp={() => handleChildMoveUp(childFlow.id)}
              onMoveDown={() => handleChildMoveDown(childFlow.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
