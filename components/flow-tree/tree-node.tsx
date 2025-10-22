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
} from "lucide-react";
import type { Screen } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TreeNodeProps {
  screen: Screen & { children?: Screen[] };
  level?: number;
  onAddChild?: (parentId: string) => void;
  onSelect?: (screen: Screen) => void;
  onUpdateTitle?: (screenId: string, newTitle: string) => void;
  onAddFlowFromScreen?: (screenId: string) => void;
  onDelete?: (screenId: string) => void;
  onDragStart?: (screen: Screen) => void;
  onDragOver?: (screen: Screen) => void;
  onDrop?: (targetScreen: Screen) => void;
  selectedId?: string;
  isDragging?: boolean;
}

// Helper function to count all descendants recursively
function countAllDescendants(screen: Screen & { children?: Screen[] }): number {
  if (!screen.children || screen.children.length === 0) return 0;

  let count = screen.children.length;
  for (const child of screen.children) {
    count += countAllDescendants(child);
  }
  return count;
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
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(screen.title);
  const [isDragOver, setIsDragOver] = useState(false);
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
    <div>
      <div
        draggable={!isEditing}
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart?.(screen);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
          onDragOver?.(screen);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          onDrop?.(screen);
        }}
        className={`
          group flex items-center gap-1 py-1 px-2 hover:bg-muted/50 rounded-sm cursor-pointer
          ${isSelected ? "bg-accent text-accent-foreground" : ""}
          ${isDragOver ? "bg-primary/20 border-t-2 border-primary" : ""}
          ${isDragging ? "opacity-50" : ""}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => !isEditing && onSelect?.(screen)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            <ChevronRight
              className={`h-3 w-3 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </button>
        ) : (
          <div className="w-4" />
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
                <span className="text-sm flex-1 truncate">
                  {screen.display_name || screen.title}
                </span>

                {screen.screenshot_url && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}

            {descendantCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {descendantCount}
              </span>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              title="Edit screen name"
            >
              <Edit2 className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onAddFlowFromScreen?.(screen.id);
              }}
              title="Create flow from this screen"
            >
              <GitBranch className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild?.(screen.id);
              }}
              title="Add child screen"
            >
              <Plus className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:text-destructive"
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
              }}
              title="Delete screen"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
