"use client";

import { ChevronDown, Plus, Trash2, MoreHorizontal } from "lucide-react";
import type { Flow } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface FlowHeaderProps {
  flow: Flow;
  isExpanded: boolean;
  isSelected: boolean;
  isDragged: boolean;
  isDragTarget: boolean;
  hasScreenshots: boolean; // New prop to indicate if any screens have screenshots
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
  hasScreenshots,
  onToggle,
  onSelect,
  onAddScreen,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: FlowHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

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
    </div>
  );
}
