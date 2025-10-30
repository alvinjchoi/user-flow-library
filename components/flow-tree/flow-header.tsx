"use client";

import {
  ChevronDown,
  Plus,
  Trash2,
  MoreHorizontal,
  GitBranch,
} from "lucide-react";
import type { Flow, Screen } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { MoveFlowDialog } from "./move-flow-dialog";

interface FlowHeaderProps {
  flow: Flow;
  isExpanded: boolean;
  isSelected: boolean;
  isDragged: boolean;
  isDragTarget: boolean;
  isFlowDragTarget: boolean;
  hasScreenshots: boolean; // New prop to indicate if any screens have screenshots
  onToggle: () => void;
  onSelect: () => void;
  onAddScreen: () => void;
  onAddFlow?: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFlowDragOver: (e: React.DragEvent) => void;
  onFlowDrop: (e: React.DragEvent) => void;
  allScreens?: Screen[];
  allFlows?: Flow[];
  onMoveFlow?: (
    flowId: string,
    targetId: string | null,
    targetType: "screen" | "flow" | "top-level"
  ) => void;
}

export function FlowHeader({
  flow,
  isExpanded,
  isSelected,
  isDragged,
  isDragTarget,
  isFlowDragTarget,
  hasScreenshots,
  onToggle,
  onSelect,
  onAddScreen,
  onAddFlow,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onFlowDragOver,
  onFlowDrop,
  allScreens = [],
  allFlows = [],
  onMoveFlow,
}: FlowHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        onDragOver(e);
        onFlowDragOver(e);
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        onDrop(e);
        onFlowDrop(e);
      }}
      onClick={() => {
        onToggle();
        onSelect();
      }}
      className={`group flex h-9 items-center gap-2 px-3 text-sm font-medium relative cursor-pointer transition-all duration-150 border border-transparent hover:bg-primary/10 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
        isSelected
          ? "bg-primary/15 text-primary font-semibold border-primary/50"
          : "text-foreground"
      } ${isDragged ? "opacity-50" : ""} ${
        isDragTarget || isFlowDragTarget
          ? "bg-primary/20 border-t-2 border-primary"
          : ""
      }`}
      role="button"
      tabIndex={0}
    >
      <ChevronDown
        className={`h-4 w-4 transition-transform flex-shrink-0 ${
          isExpanded ? "" : "-rotate-90"
        }`}
      />
      <span className="flex-1 truncate text-left">{flow.name}</span>

      {hasScreenshots && (
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
      )}

      <span className="text-xs text-muted-foreground font-normal">
        {flow.screen_count}
      </span>

      {/* Three-dot menu */}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-100 transition-opacity hover:bg-muted border border-red-500"
            onClick={(e) => e.stopPropagation()}
            title="Flow actions"
          >
            <MoreHorizontal className="h-4 w-4 text-red-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onAddFlow?.();
              setMenuOpen(false);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add flow
          </DropdownMenuItem>
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
              onDelete();
              setMenuOpen(false);
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete flow
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
