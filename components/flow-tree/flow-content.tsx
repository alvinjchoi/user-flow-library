"use client";

import type { Flow, Screen } from "@/lib/database.types";
import { TreeNode } from "./tree-node";
import { BranchedFlowItem } from "./branched-flow-item";
import { buildScreenTree } from "@/lib/flows";

// Helper to group screens by display_name (for scroll captures)
function groupScreensByDisplayName(screens: Screen[]): Screen[] {
  const grouped = new Map<string, Screen[]>();
  const result: Screen[] = [];

  // Group screens by display_name
  screens.forEach((screen) => {
    const displayName = screen.display_name || screen.title;
    if (!grouped.has(displayName)) {
      grouped.set(displayName, []);
    }
    grouped.get(displayName)!.push(screen);
  });

  // Create representative screens with groupedScreens property
  grouped.forEach((groupScreens, displayName) => {
    if (groupScreens.length === 1) {
      // Single screen, add as-is
      result.push(groupScreens[0]);
    } else {
      // Multiple screens with same display_name - use first as representative
      const representative = {
        ...groupScreens[0],
        groupedScreens: groupScreens,
      };
      result.push(representative);
    }
  });

  return result;
}

interface FlowContentProps {
  flow: Flow;
  screens: Screen[];
  isExpanded: boolean;
  branchedFlowsByParent: Map<string, Flow[]>;
  screensByFlow: Map<string, Screen[]>;
  expandedFlows: Set<string>;
  selectedScreenId?: string;
  selectedFlowId?: string;
  draggedScreen?: Screen | null;
  onAddScreen: (flowId: string, parentId?: string) => void;
  onSelectScreen: (screen: Screen) => void;
  onSelectFlow: (flow: Flow) => void;
  onUpdateScreenTitle: (screenId: string, newTitle: string) => void;
  onAddFlowFromScreen: (screenId: string) => void;
  onDeleteScreen: (screenId: string) => void;
  onDragStart: (screen: Screen) => void;
  onDragOver: (screen: Screen) => void;
  onDrop: (screen: Screen) => void;
  onToggleFlow: (flowId: string) => void;
}

export function FlowContent({
  flow,
  screens,
  isExpanded,
  branchedFlowsByParent,
  screensByFlow,
  expandedFlows,
  selectedScreenId,
  selectedFlowId,
  draggedScreen,
  onAddScreen,
  onSelectScreen,
  onSelectFlow,
  onUpdateScreenTitle,
  onAddFlowFromScreen,
  onDeleteScreen,
  onDragStart,
  onDragOver,
  onDrop,
  onToggleFlow,
}: FlowContentProps) {
  const tree = buildScreenTree(screens);

  // Group root-level screens by display_name
  const groupedTree = tree.map((rootScreen) => {
    // For each root screen, group its direct children (not nested children)
    if (rootScreen.children && rootScreen.children.length > 0) {
      const groupedChildren = groupScreensByDisplayName(rootScreen.children);
      return { ...rootScreen, children: groupedChildren };
    }
    return rootScreen;
  });

  // Also group root-level screens themselves
  const finalTree = groupScreensByDisplayName(groupedTree);

  return (
    <div className="select-none">
      {/* Screen Tree */}
      {isExpanded && (
        <div className="border-l border-muted/30 ml-3">
          {finalTree.length === 0 ? (
            <div className="pl-6 py-3 text-xs text-muted-foreground">
              No screens yet
            </div>
          ) : (
            finalTree.map((screen) => (
              <div key={screen.id}>
                <TreeNode
                  screen={screen}
                  level={0}
                  onAddChild={(parentId) => onAddScreen(flow.id, parentId)}
                  onSelect={onSelectScreen}
                  onUpdateTitle={onUpdateScreenTitle}
                  onAddFlowFromScreen={onAddFlowFromScreen}
                  onDelete={onDeleteScreen}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  selectedId={selectedScreenId}
                  isDragging={draggedScreen?.id === screen.id}
                />

                {/* Show branched flows under this screen */}
                {branchedFlowsByParent.has(screen.id) && (
                  <div>
                    {branchedFlowsByParent
                      .get(screen.id)!
                      .map((branchedFlow) => {
                        const branchedScreens =
                          screensByFlow.get(branchedFlow.id) || [];
                        const isBranchedExpanded = expandedFlows.has(
                          branchedFlow.id
                        );
                        const isBranchedSelected =
                          selectedFlowId === branchedFlow.id;

                        return (
                          <BranchedFlowItem
                            key={branchedFlow.id}
                            flow={branchedFlow}
                            screens={branchedScreens}
                            level={screen.level + 1} // Branched flows are one level deeper than their parent screen
                            isExpanded={isBranchedExpanded}
                            isSelected={isBranchedSelected}
                            onToggle={() => onToggleFlow(branchedFlow.id)}
                            onSelect={() => onSelectFlow(branchedFlow)}
                            onAddScreen={(parentId) =>
                              onAddScreen(branchedFlow.id, parentId)
                            }
                            onSelectScreen={onSelectScreen}
                            onUpdateScreenTitle={onUpdateScreenTitle}
                            onAddFlowFromScreen={onAddFlowFromScreen}
                            onDeleteScreen={onDeleteScreen}
                            onDragStart={onDragStart}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            selectedScreenId={selectedScreenId}
                            draggedScreen={draggedScreen}
                          />
                        );
                      })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
