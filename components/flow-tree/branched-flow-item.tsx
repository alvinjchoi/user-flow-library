"use client";

import { ChevronDown } from "lucide-react";
import type { Flow, Screen } from "@/lib/database.types";
import { TreeNode } from "./tree-node";
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

interface BranchedFlowItemProps {
  flow: Flow;
  screens: Screen[];
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAddScreen: (parentId?: string) => void;
  onSelectScreen: (screen: Screen) => void;
  onUpdateScreenTitle: (screenId: string, newTitle: string) => void;
  onAddFlowFromScreen: (screenId: string) => void;
  onDeleteScreen: (screenId: string) => void;
  onDragStart: (screen: Screen) => void;
  onDragOver: (screen: Screen) => void;
  onDrop: (screen: Screen) => void;
  selectedScreenId?: string;
  draggedScreen?: Screen | null;
}

export function BranchedFlowItem({
  flow,
  screens,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onAddScreen,
  onSelectScreen,
  onUpdateScreenTitle,
  onAddFlowFromScreen,
  onDeleteScreen,
  onDragStart,
  onDragOver,
  onDrop,
  selectedScreenId,
  draggedScreen,
}: BranchedFlowItemProps) {
  const tree = buildScreenTree(screens);
  const groupedTree = groupScreensByDisplayName(tree);

  return (
    <div className="mb-3">
      {/* Branched Flow Header */}
      <div
        onClick={() => {
          onToggle();
          onSelect();
        }}
        className={`flex h-8 items-center gap-2 px-2 text-xs font-medium cursor-pointer transition-all duration-150 hover:bg-muted/30 group ${
          isSelected
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground"
        }`}
        role="button"
        tabIndex={0}
      >
        <ChevronDown
          className={`h-3 w-3 transition-transform flex-shrink-0 ${
            isExpanded ? "" : "-rotate-90"
          }`}
        />
        <span className="flex-1 truncate text-left">{flow.name}</span>
        <span className="text-xs text-muted-foreground font-normal">
          {flow.screen_count}
        </span>
      </div>

      {/* Branched Flow Screens */}
      {isExpanded && (
        <div className="ml-4 border-l border-muted/20 pl-2">
          {groupedTree.length === 0 ? (
            <div className="pl-4 py-2 text-xs text-muted-foreground">
              No screens yet
            </div>
          ) : (
            groupedTree.map((screen) => (
              <TreeNode
                key={screen.id}
                screen={screen}
                level={screen.level}
                onAddChild={(parentId) => onAddScreen(parentId)}
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
