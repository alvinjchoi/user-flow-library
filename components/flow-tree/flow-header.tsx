"use client";

import {
  ChevronDown,
  Plus,
  Trash2,
  MoreHorizontal,
  GitBranch,
  ArrowUp,
  ArrowDown,
  CornerDownRight,
  Pencil,
} from "lucide-react";
import type { Flow, Screen } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { MoveFlowDialog } from "./move-flow-dialog";

interface FlowHeaderProps {
  flow: Flow;
  isExpanded: boolean;
  isSelected: boolean;
  isDragged: boolean;
  isDragTarget: boolean;
  isFlowDragTarget: boolean;
  hasScreenshots: boolean; // New prop to indicate if any screens have screenshots
  screenCount: number; // Dynamic screen count from actual screens
  onToggle: () => void;
  onSelect: () => void;
  onAddScreen: () => void;
  onAddFlow?: (parentFlowId?: string) => void;
  onDelete: () => void;
  onUpdateFlowName?: (flowId: string, newName: string) => void;
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
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function FlowHeader({
  flow,
  isExpanded,
  isSelected,
  isDragged,
  isDragTarget,
  isFlowDragTarget,
  hasScreenshots,
  screenCount,
  onToggle,
  onSelect,
  onAddScreen,
  onAddFlow,
  onDelete,
  onUpdateFlowName,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onFlowDragOver,
  onFlowDrop,
  allScreens = [],
  allFlows = [],
  onMoveFlow,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: FlowHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(flow.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveName = () => {
    if (editName.trim() && editName !== flow.name) {
      onUpdateFlowName?.(flow.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setEditName(flow.name);
      setIsEditing(false);
    }
  };

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
        if (isEditing) {
          // Don't toggle/select while editing
          return;
        }
        if (isSelected) {
          // Already selected (viewing this section), toggle fold state
          onToggle();
        } else {
          // Not selected, just jump to this section
          onSelect();
        }
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
      {flow.parent_flow_id && (
        <CornerDownRight className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
      )}
      {isEditing ? (
        <div
          className="flex-1 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={handleKeyDown}
            className="h-6 text-sm px-2 py-0 flex-1"
          />
        </div>
      ) : (
        <span className="flex-1 truncate text-left">{flow.name}</span>
      )}

      {hasScreenshots && (
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
      )}

      <span className="text-xs text-muted-foreground font-normal">
        {screenCount}
      </span>

      {/* Three-dot menu */}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
            onClick={(e) => e.stopPropagation()}
            title="Flow actions"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onAddFlow?.(flow.id);
              setMenuOpen(false);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add flow
          </DropdownMenuItem>
          {flow.name.toLowerCase() !== "account" && (
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
          )}
          {onUpdateFlowName && flow.parent_flow_id && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setMenuOpen(false);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit flow name
              </DropdownMenuItem>
            </>
          )}
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
          {(canMoveUp || canMoveDown) && <DropdownMenuSeparator />}
          {canMoveUp && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp?.();
                setMenuOpen(false);
              }}
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Move up
            </DropdownMenuItem>
          )}
          {canMoveDown && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown?.();
                setMenuOpen(false);
              }}
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              Move down
            </DropdownMenuItem>
          )}
          {(canMoveUp || canMoveDown) && <DropdownMenuSeparator />}
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
