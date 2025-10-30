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
  onAddFlow?: () => void;
  onAddScreen: (flowId: string, parentId?: string) => void;
  onUpdateScreenTitle: (screenId: string, newTitle: string) => void;
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
}: FlowItemProps) {
  const screens = screensByFlow.get(flow.id) || [];
  const isExpanded = expandedFlows.has(flow.id);
  const isSelected = selectedFlowId === flow.id;
  const isDragged = draggedFlow?.id === flow.id;
  const isDragTarget = dragTargetFlow?.id === flow.id;
  const isFlowDragTarget = dragTargetFlowForFlow?.id === flow.id;
  const hasScreenshots = screens.some((screen) => screen.screenshot_url);

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
        onToggle={() => onToggleFlow(flow.id)}
        onSelect={() => onSelectFlow(flow)}
        onAddScreen={() => onAddScreen(flow.id)}
        onAddFlow={onAddFlow}
        onDelete={() => {
          if (confirm(`Delete flow "${flow.name}" and all its screens?`)) {
            onDeleteFlow(flow.id);
          }
        }}
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
        draggedFlow={draggedFlow}
        dragTargetScreenForFlow={dragTargetScreenForFlow}
        onAddScreen={onAddScreen}
        onSelectScreen={onSelectScreen}
        onSelectFlow={onSelectFlow}
        onUpdateScreenTitle={onUpdateScreenTitle}
        onAddFlowFromScreen={onAddFlowFromScreen}
        onDeleteScreen={onDeleteScreen}
        onDeleteFlow={onDeleteFlow}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onToggleFlow={onToggleFlow}
        onMoveFlowToScreen={onMoveFlowToScreen}
        onFlowDragOverScreen={onFlowDragOverScreen}
        onFlowDragLeaveScreen={onFlowDragLeaveScreen}
        allScreens={allScreens}
        allFlows={flows}
        onMoveFlow={onMoveFlow}
      />

      {/* Recursively render child flows */}
      {childFlowsByParent.has(flow.id) && (
        <div className="border-l border-muted/30 ml-3">
          {childFlowsByParent.get(flow.id)!.map((childFlow) => (
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
