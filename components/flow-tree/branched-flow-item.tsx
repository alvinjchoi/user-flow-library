"use client";

import { useState } from "react";
import {
  ChevronDown,
  Plus,
  Trash2,
  MoreHorizontal,
  GitBranch,
} from "lucide-react";
import type { Flow, Screen } from "@/lib/database.types";
import { TreeNode } from "./tree-node";
import { buildScreenTree } from "@/lib/flows";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoveFlowDialog } from "./move-flow-dialog";

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
  level: number; // Add level prop for consistent indentation
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAddScreen: (parentId?: string) => void;
  onSelectScreen: (screen: Screen) => void;
  onUpdateScreenTitle: (screenId: string, newTitle: string) => void;
  onAddFlowFromScreen: (screenId: string) => void;
  onDeleteScreen: (screenId: string) => void;
  onDeleteFlow?: (flowId: string) => void; // Add delete flow handler
  onDragStart: (screen: Screen) => void;
  onDragOver: (screen: Screen) => void;
  onDrop: (screen: Screen) => void;
  selectedScreenId?: string;
  draggedScreen?: Screen | null;
  draggedFlow?: any;
  dragTargetScreenForFlow?: Screen | null;
  onMoveFlowToScreen?: (flowId: string, screenId: string | null) => void;
  onFlowDragOverScreen?: (screen: Screen) => void;
  onFlowDragLeaveScreen?: () => void;
  allScreens?: Screen[];
  allFlows?: Flow[];
  onMoveFlow?: (
    flowId: string,
    targetId: string | null,
    targetType: "screen" | "flow" | "top-level"
  ) => void;
}

export function BranchedFlowItem({
  flow,
  screens,
  level,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onAddScreen,
  onSelectScreen,
  onUpdateScreenTitle,
  onAddFlowFromScreen,
  onDeleteScreen,
  onDeleteFlow,
  onDragStart,
  onDragOver,
  onDrop,
  selectedScreenId,
  draggedScreen,
  draggedFlow,
  dragTargetScreenForFlow,
  onMoveFlowToScreen,
  onFlowDragOverScreen,
  onFlowDragLeaveScreen,
  allScreens = [],
  allFlows = [],
  onMoveFlow,
}: BranchedFlowItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const tree = buildScreenTree(screens);
  const groupedTree = groupScreensByDisplayName(tree);

  return (
    <div>
      {/* Branched Flow Header */}
      <div
        onClick={() => {
          onToggle();
          onSelect();
        }}
        className={`group flex items-center gap-2 h-9 px-3 cursor-pointer transition-all duration-150 relative border border-transparent hover:bg-primary/10 hover:border-primary/40 ${
          isSelected
            ? "bg-primary/15 text-primary font-medium border-primary/50"
            : "text-foreground"
        }`}
        role="button"
        tabIndex={0}
      >
        {/* Visual hierarchy lines - same as TreeNode */}
        <div
          className="absolute left-0 top-0 bottom-0 flex items-stretch"
          style={{ width: `${(level + 1) * 24}px` }}
        >
          {Array.from({ length: level + 1 }).map((_, i) => (
            <div
              key={i}
              className="w-6 flex items-center border-l border-border"
              style={{ marginLeft: i === 0 ? "8px" : "0" }}
            >
              {i === level && (
                <div className="w-full border-b border-border h-1/2"></div>
              )}
            </div>
          ))}
        </div>

        <div
          className="flex items-center gap-2 flex-1 relative"
          style={{ marginLeft: `${(level + 1) * 24}px` }}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform flex-shrink-0 ${
              isExpanded ? "" : "-rotate-90"
            }`}
          />
          <span className="text-sm flex-1 truncate font-medium">
            {flow.name}
          </span>
          <span className="text-xs text-muted-foreground font-normal">
            {flow.screen_count}
          </span>

          {/* Three-dot menu */}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onAddScreen();
                  setMenuOpen(false);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add screen
              </DropdownMenuItem>
              {onMoveFlow && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoveDialogOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  Move flow to...
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    confirm(`Delete flow "${flow.name}" and all its screens?`)
                  ) {
                    onDeleteFlow?.(flow.id);
                  }
                  setMenuOpen(false);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete flow
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Branched Flow Screens */}
      {isExpanded && (
        <div>
          {groupedTree.length === 0 ? (
            <div className="pl-4 py-2 text-xs text-muted-foreground">
              No screens yet
            </div>
          ) : (
            groupedTree.map((screen) => (
              <TreeNode
                key={screen.id}
                screen={screen}
                level={level + 1}
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
                draggedFlow={draggedFlow}
                isFlowDragTarget={dragTargetScreenForFlow?.id === screen.id}
                onMoveFlowToScreen={onMoveFlowToScreen}
                onFlowDragOverScreen={onFlowDragOverScreen}
                onFlowDragLeaveScreen={onFlowDragLeaveScreen}
              />
            ))
          )}
        </div>
      )}

      {/* Move Flow Dialog */}
      {onMoveFlow && (
        <MoveFlowDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          flow={flow}
          allScreens={allScreens}
          allFlows={allFlows}
          onMove={(targetId, targetType) => {
            onMoveFlow(flow.id, targetId, targetType);
          }}
        />
      )}
    </div>
  );
}
