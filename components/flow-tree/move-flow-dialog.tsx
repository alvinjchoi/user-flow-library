"use client";

import { useState, useMemo, useEffect } from "react";
import type { Flow, Screen } from "@/lib/database.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Layers, File, MapPin, ArrowRight } from "lucide-react";

interface MoveFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flow: Flow;
  allScreens: Screen[];
  allFlows: Flow[];
  onMove: (
    targetId: string | null,
    targetType: "screen" | "flow" | "top-level"
  ) => void;
}

export function MoveFlowDialog({
  open,
  onOpenChange,
  flow,
  allScreens,
  allFlows,
  onMove,
}: MoveFlowDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // T: Make top-level
      if (
        e.key === "t" &&
        !e.metaKey &&
        !e.ctrlKey &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        e.preventDefault();
        onMove(null, "top-level");
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onMove, onOpenChange]);

  // Recursively find all descendant flows to prevent circular dependencies
  const getDescendantFlowIds = (flowId: string): Set<string> => {
    const descendants = new Set<string>([flowId]);
    const directChildren = allFlows.filter((f) => f.parent_flow_id === flowId);

    for (const child of directChildren) {
      const childDescendants = getDescendantFlowIds(child.id);
      childDescendants.forEach((id) => descendants.add(id));
    }

    return descendants;
  };

  const descendantIds = getDescendantFlowIds(flow.id);

  // Filter out the current flow and its descendants
  const availableScreens = allScreens.filter((s) => s.flow_id !== flow.id);

  const availableFlows = allFlows.filter((f) => !descendantIds.has(f.id));

  const filteredScreens = availableScreens.filter((screen) =>
    (screen.display_name || screen.title)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const filteredFlows = availableFlows.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current location info
  const currentLocation = useMemo(() => {
    if (flow.parent_flow_id) {
      const parentFlow = allFlows.find((f) => f.id === flow.parent_flow_id);
      return {
        type: "flow" as const,
        name: parentFlow?.name || "Unknown Flow",
      };
    } else if (flow.parent_screen_id) {
      const parentScreen = allScreens.find(
        (s) => s.id === flow.parent_screen_id
      );
      return {
        type: "screen" as const,
        name:
          parentScreen?.display_name || parentScreen?.title || "Unknown Screen",
      };
    }
    return { type: "top-level" as const, name: "Top Level" };
  }, [flow, allFlows, allScreens]);

  // Group flows by parent for better visualization
  const groupedFlows = useMemo(() => {
    const groups: { [key: string]: Flow[] } = {
      "Top Level": filteredFlows.filter(
        (f) => !f.parent_flow_id && !f.parent_screen_id
      ),
      "Child Flows": filteredFlows.filter((f) => f.parent_flow_id),
      "Branch Flows": filteredFlows.filter(
        (f) => f.parent_screen_id && !f.parent_flow_id
      ),
    };
    return groups;
  }, [filteredFlows]);

  // Quick actions - siblings and parent
  const quickActions = useMemo(() => {
    const actions: {
      label: string;
      targetId: string | null;
      type: "screen" | "flow" | "top-level";
      description: string;
    }[] = [];

    // Siblings (flows with same parent)
    const siblings = allFlows.filter((f) => {
      if (f.id === flow.id) return false;

      // Same parent flow
      if (flow.parent_flow_id && f.parent_flow_id === flow.parent_flow_id)
        return true;

      // Same parent screen
      if (flow.parent_screen_id && f.parent_screen_id === flow.parent_screen_id)
        return true;

      return false;
    });

    if (siblings.length > 0) {
      const sibling = siblings[0];
      const parentName = flow.parent_flow_id
        ? allFlows.find((f) => f.id === flow.parent_flow_id)?.name
        : flow.parent_screen_id
        ? allScreens.find((s) => s.id === flow.parent_screen_id)
            ?.display_name ||
          allScreens.find((s) => s.id === flow.parent_screen_id)?.title
        : null;

      if (parentName) {
        actions.push({
          label: `Same level as "${sibling.name}"`,
          targetId: flow.parent_flow_id || flow.parent_screen_id || null,
          type: flow.parent_flow_id
            ? "flow"
            : flow.parent_screen_id
            ? "screen"
            : "top-level",
          description: `Keep under ${parentName}`,
        });
      }
    }

    // Move to grandparent (one level up)
    if (flow.parent_flow_id) {
      const parent = allFlows.find((f) => f.id === flow.parent_flow_id);
      if (parent) {
        if (parent.parent_flow_id) {
          const grandparent = allFlows.find(
            (f) => f.id === parent.parent_flow_id
          );
          if (grandparent) {
            actions.push({
              label: `Move up to "${grandparent.name}"`,
              targetId: grandparent.id,
              type: "flow",
              description: "One level up in hierarchy",
            });
          }
        } else if (parent.parent_screen_id) {
          const grandparentScreen = allScreens.find(
            (s) => s.id === parent.parent_screen_id
          );
          if (grandparentScreen) {
            actions.push({
              label: `Move up to "${
                grandparentScreen.display_name || grandparentScreen.title
              }"`,
              targetId: grandparentScreen.id,
              type: "screen",
              description: "One level up in hierarchy",
            });
          }
        } else {
          actions.push({
            label: "Move to top level",
            targetId: null,
            type: "top-level",
            description: "Two levels up",
          });
        }
      }
    }

    return actions;
  }, [flow, allFlows, allScreens]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Move "{flow.name}"</DialogTitle>
          <DialogDescription>
            Select a screen to branch from, or a flow to nest under. You can
            also make it a top-level flow.
          </DialogDescription>
        </DialogHeader>

        {/* Current Location Badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md text-sm border">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Currently:</span>
          <span className="font-medium">
            {currentLocation.type === "flow" && `Under ${currentLocation.name}`}
            {currentLocation.type === "screen" &&
              `Branching from ${currentLocation.name}`}
            {currentLocation.type === "top-level" && currentLocation.name}
          </span>
        </div>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search screens or flows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Quick Actions */}
          {quickActions.length > 0 && !searchTerm && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <span className="text-primary">⚡</span>
                Quick Actions
              </h3>
              <div className="space-y-1 border rounded-md p-2 bg-primary/5">
                {quickActions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    className="w-full justify-start text-sm h-auto py-2 hover:bg-primary/10"
                    onClick={() => {
                      onMove(action.targetId, action.type);
                      onOpenChange(false);
                    }}
                  >
                    <ArrowRight className="h-4 w-4 mr-2 flex-shrink-0 text-primary" />
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="truncate font-medium">
                        {action.label}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {action.description}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Top-level option */}
          <div>
            <h3 className="text-sm font-medium mb-2">Top-level</h3>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                onMove(null, "top-level");
                onOpenChange(false);
              }}
            >
              <Layers className="h-4 w-4 mr-2" />
              Make top-level flow
            </Button>
          </div>

          {/* Screens */}
          {filteredScreens.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Branch from screen</h3>
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
                {filteredScreens.map((screen) => (
                  <Button
                    key={screen.id}
                    variant="ghost"
                    className="w-full justify-start text-sm h-auto py-2"
                    onClick={() => {
                      onMove(screen.id, "screen");
                      onOpenChange(false);
                    }}
                  >
                    <File className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {screen.display_name || screen.title}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Flows - Grouped by Type */}
          {filteredFlows.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Nest under flow</h3>
              <div className="max-h-64 overflow-y-auto space-y-3 border rounded-md p-2">
                {Object.entries(groupedFlows).map(
                  ([groupName, flows]) =>
                    flows.length > 0 && (
                      <div key={groupName}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-2">
                          {groupName}
                        </p>
                        <div className="space-y-1">
                          {flows.map((targetFlow) => {
                            const parentInfo = targetFlow.parent_flow_id
                              ? allFlows.find(
                                  (f) => f.id === targetFlow.parent_flow_id
                                )?.name
                              : targetFlow.parent_screen_id
                              ? allScreens.find(
                                  (s) => s.id === targetFlow.parent_screen_id
                                )?.display_name ||
                                allScreens.find(
                                  (s) => s.id === targetFlow.parent_screen_id
                                )?.title
                              : null;

                            return (
                              <Button
                                key={targetFlow.id}
                                variant="ghost"
                                className="w-full justify-start text-sm h-auto py-2 hover:bg-primary/10"
                                onClick={() => {
                                  onMove(targetFlow.id, "flow");
                                  onOpenChange(false);
                                }}
                              >
                                <Layers className="h-4 w-4 mr-2 flex-shrink-0" />
                                <div className="flex flex-col items-start flex-1 min-w-0">
                                  <span className="truncate font-medium">
                                    {targetFlow.name}
                                  </span>
                                  {parentInfo && (
                                    <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                      <ArrowRight className="h-3 w-3" />
                                      {parentInfo}
                                    </span>
                                  )}
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {searchTerm &&
            filteredScreens.length === 0 &&
            filteredFlows.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No screens or flows found matching "{searchTerm}"
              </p>
            )}
        </div>

        <div className="space-y-2 mt-4">
          <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
            💡 <strong>Tip:</strong> You can also drag and drop this flow onto
            screens or other flows to move it.
          </div>
          <div className="text-xs text-muted-foreground p-2 border rounded-md flex items-center justify-between">
            <span className="font-medium">Keyboard Shortcuts:</span>
            <span className="flex items-center gap-3">
              <kbd className="px-2 py-0.5 bg-muted rounded text-xs border">
                T
              </kbd>
              <span>Make top-level</span>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
