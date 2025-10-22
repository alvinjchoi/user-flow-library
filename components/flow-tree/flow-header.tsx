"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { Flow } from "@/lib/database.types";
import { Button } from "@/components/ui/button";

interface FlowHeaderProps {
  flow: Flow;
  isExpanded: boolean;
  isSelected: boolean;
  isDragged: boolean;
  isDragTarget: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAddScreen: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export function FlowHeader({
  flow,
  isExpanded,
  isSelected,
  isDragged,
  isDragTarget,
  onToggle,
  onSelect,
  onAddScreen,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: FlowHeaderProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => {
        onToggle();
        onSelect();
      }}
      className={`flex h-9 items-center gap-2 px-3 text-sm font-medium relative cursor-pointer transition-all duration-150 hover:bg-muted/50 group ${
        isSelected
          ? "bg-primary/10 text-primary font-semibold"
          : "text-foreground"
      } ${isDragged ? "opacity-50" : ""} ${
        isDragTarget ? "bg-primary/20 border-t-2 border-primary" : ""
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
      <span className="text-xs text-muted-foreground font-normal">
        {flow.screen_count}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            onAddScreen();
          }}
          title="Add screen"
        >
          <Plus className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete flow"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
