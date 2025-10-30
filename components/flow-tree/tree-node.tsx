"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  Plus,
  Edit2,
  Check,
  X,
  GitBranch,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import type { Screen } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper function to count all descendants recursively
function countAllDescendants(screen: Screen & { children?: Screen[] }): number {
  if (!screen.children || screen.children.length === 0) return 0;

  let count = screen.children.length;
  for (const child of screen.children) {
    count += countAllDescendants(child);
  }
  return count;
}

interface TreeNodeProps {
  screen: Screen & { children?: Screen[]; groupedScreens?: Screen[] };
  level?: number;
  onAddChild?: (parentId: string) => void;
  onSelect?: (screen: Screen) => void;
  onUpdateTitle?: (screenId: string, newTitle: string) => void;
  onAddFlowFromScreen?: (screenId: string) => void;
  onDelete?: (screenId: string) => void;
  onDragStart?: (screen: Screen) => void;
  onDragOver?: (screen: Screen) => void;
  onDrop?: (screen: Screen) => void;
  selectedId?: string;
  isDragging?: boolean;
  draggedFlow?: any; // Flow type
  isFlowDragTarget?: boolean;
  onMoveFlowToScreen?: (flowId: string, screenId: string | null) => void;
  onFlowDragOverScreen?: (screen: Screen) => void;
  onFlowDragLeaveScreen?: () => void;
}

export function TreeNode({
  screen,
  level = 0,
  onAddChild,
  onSelect,
  onUpdateTitle,
  onAddFlowFromScreen,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  selectedId,
  isDragging = false,
  draggedFlow,
  isFlowDragTarget = false,
  onMoveFlowToScreen,
  onFlowDragOverScreen,
  onFlowDragLeaveScreen,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(screen.title);
  const [isDragOver, setIsDragOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDraggingNow, setIsDraggingNow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasChildren = screen.children && screen.children.length > 0;
  const isSelected = selectedId === screen.id;
  const descendantCount = countAllDescendants(screen);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== screen.title) {
      onUpdateTitle?.(screen.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(screen.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div className="relative">
      <div
        draggable={!isEditing}
        onDragStart={(e) => {
          e.stopPropagation();
          setIsDraggingNow(true);
          onDragStart?.(screen);
        }}
        onDragEnd={() => {
          setIsDraggingNow(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();

          // Check if we're dragging a flow
          if (draggedFlow) {
            onFlowDragOverScreen?.(screen);
          } else {
            setIsDragOver(true);
            onDragOver?.(screen);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();

          if (draggedFlow) {
            onFlowDragLeaveScreen?.();
          } else {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);

          // Check if we're dropping a flow
          if (draggedFlow) {
            onMoveFlowToScreen?.(draggedFlow.id, screen.id);
            onFlowDragLeaveScreen?.();
          } else {
            onDrop?.(screen);
          }
        }}
        className={`
          group flex items-center gap-2 h-9 px-3 relative cursor-pointer transition-all duration-150 border border-transparent hover:bg-primary/10 hover:border-primary/40
          ${
            isSelected
              ? "bg-primary/15 text-primary font-medium border-primary/50"
              : "text-foreground"
          }
          ${
            isDragOver || isFlowDragTarget
              ? "bg-primary/20 border-t-2 border-primary"
              : ""
          }
          ${isDragging ? "opacity-50" : ""}
        `}
        onClick={() => {
          if (!isEditing && !isDraggingNow) {
            onSelect?.(screen);
          }
        }}
      >
        {/* Visual hierarchy lines - show for all screens including level 0 */}
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
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-0.5 hover:bg-muted/50 rounded flex-shrink-0"
            >
              <ChevronRight
                className={`h-3 w-3 transition-transform text-muted-foreground ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            </button>
          ) : (
            <div className="w-4 flex-shrink-0" />
          )}

          {isEditing ? (
            <div className="flex-1 flex items-center gap-1">
              <Input
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-6 text-sm px-2 py-0"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveTitle();
                }}
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelEdit();
                }}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          ) : (
            <>
              <span className="text-sm flex-1 truncate font-medium">
                {screen.display_name || screen.title}
              </span>

              {screen.screenshot_url && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              )}

              {screen.groupedScreens && screen.groupedScreens.length > 1 && (
                <span className="text-xs text-muted-foreground font-normal">
                  {screen.groupedScreens.length}
                </span>
              )}

              {descendantCount > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  {descendantCount}
                </span>
              )}

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
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit screen name
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddFlowFromScreen?.(screen.id);
                      setMenuOpen(false);
                    }}
                  >
                    <GitBranch className="h-4 w-4 mr-2" />
                    Create flow from this screen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddChild?.(screen.id);
                      setMenuOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add child screen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm(
                          `Delete "${screen.title}"?${
                            hasChildren
                              ? " This will also delete all child screens."
                              : ""
                          }`
                        )
                      ) {
                        onDelete?.(screen.id);
                      }
                      setMenuOpen(false);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete screen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {screen.children!.map((child) => (
            <TreeNode
              key={child.id}
              screen={child}
              level={level + 1}
              onAddChild={onAddChild}
              onSelect={onSelect}
              onUpdateTitle={onUpdateTitle}
              onAddFlowFromScreen={onAddFlowFromScreen}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              selectedId={selectedId}
              isDragging={false}
              draggedFlow={draggedFlow}
              isFlowDragTarget={false}
              onMoveFlowToScreen={onMoveFlowToScreen}
              onFlowDragOverScreen={onFlowDragOverScreen}
              onFlowDragLeaveScreen={onFlowDragLeaveScreen}
            />
          ))}
        </div>
      )}
    </div>
  );
}
