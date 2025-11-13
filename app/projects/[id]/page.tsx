"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Flow, Screen, Project } from "@/lib/database.types";
import { FlowSidebar } from "@/components/flow-tree/flow-sidebar";
import { ScreenGalleryByFlow } from "@/components/screens/screen-gallery-by-flow";
import { EditScreenDialog } from "@/components/screens/edit-screen-dialog";
import { AddScreenDialog } from "@/components/screens/add-screen-dialog";
import { Header } from "@/components/header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { initializeStorage } from "@/lib/storage";
import { useProjectData, useFlowSelection, useScreenSelection } from "@/hooks/useProjectData";
import { useScreenActions, useFlowActions } from "@/hooks/useScreenActions";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // Use custom hooks for data loading
  const {
    project,
    flows,
    screensByFlow,
    allScreens,
    loading,
    error,
    refetch,
  } = useProjectData(projectId);

  // Use custom hooks for state management
  const { selectedFlow, setSelectedFlow } = useFlowSelection(flows);
  const { selectedScreen, setSelectedScreen, clearSelection } = useScreenSelection();

  // Local project state for header updates
  const [localProject, setLocalProject] = useState<Project | null>(project);

  // Dialog state
  const [editScreenDialogOpen, setEditScreenDialogOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [addScreenDialogOpen, setAddScreenDialogOpen] = useState(false);
  const [addScreenFlowId, setAddScreenFlowId] = useState<string | null>(null);
  const [addScreenParentId, setAddScreenParentId] = useState<
    string | undefined
  >(undefined);

  // Use custom hooks for actions
  const screenActions = useScreenActions({
    onSuccess: () => refetch(),
  });

  const flowActions = useFlowActions({
    onSuccess: () => refetch(),
  });

  // Sync local project state with hook state
  useEffect(() => {
    if (project) {
      setLocalProject(project);
    }
  }, [project]);

  // Set page title based on project name
  useEffect(() => {
    if (project) {
      document.title = `User Flow Library | ${project.name}`;
    }
  }, [project]);

  useEffect(() => {
    initializeStorage();
  }, []);

  async function handleAddFlow(parentFlowId?: string) {
    if (!project) return;

    let promptMessage = "Flow name:";
    if (parentFlowId) {
      const parentFlow = flows.find((f) => f.id === parentFlowId);
      if (parentFlow) {
        promptMessage = `Create a new flow under "${parentFlow.name}".\n\nFlow name:`;
      }
    }

    const name = prompt(promptMessage);
    if (!name) return;

    try {
      await flowActions.addFlow(project.id, name, undefined, undefined, parentFlowId);
    } catch (error) {
      console.error("Error creating flow:", error);
      alert("Failed to create flow");
    }
  }

  async function handleAddFlowFromScreen(screenId: string) {
    if (!project) return;

    const screen = allScreens.find((s) => s.id === screenId);
    if (!screen) return;

    const flowName = prompt(
      `Create a new flow branching from "${screen.title}".\n\nFlow name:`
    );
    if (!flowName) return;

    try {
      await flowActions.addFlow(project.id, flowName, undefined, screenId);
    } catch (error) {
      console.error("Error creating flow from screen:", error);
      alert("Failed to create flow");
    }
  }

  function openAddScreenDialog(flowId: string, parentId?: string) {
    setAddScreenFlowId(flowId);
    setAddScreenParentId(parentId);
    setAddScreenDialogOpen(true);
  }

  async function handleAddScreen(
    title: string,
    parentId?: string,
    screenshotFile?: File,
    description?: string,
    displayName?: string
  ) {
    if (!addScreenFlowId) return;

    try {
      await screenActions.addScreen(
        addScreenFlowId,
        title,
        parentId,
        description,
        displayName,
        screenshotFile
      );

      // Close dialog
      setAddScreenDialogOpen(false);
      setAddScreenFlowId(null);
      setAddScreenParentId(undefined);
    } catch (error) {
      console.error(
        "Error adding screen:",
        error instanceof Error ? error.message : String(error)
      );
      alert("Failed to create screen");
    }
  }

  function handleUploadScreenshot(screenId: string) {
    const screen = allScreens.find((s) => s.id === screenId);
    if (screen) {
      setEditingScreen(screen);
      setEditScreenDialogOpen(true);
    }
  }

  async function handleDeleteScreenshot(screenId: string) {
    try {
      await screenActions.updateScreen(screenId, { screenshot_url: null });
    } catch (error) {
      console.error("Error deleting screenshot:", error);
      alert("Failed to delete screenshot");
    }
  }

  async function handleArchiveScreen(screenId: string) {
    try {
      await screenActions.deleteScreen(screenId);

      // Clear selection if archived screen was selected
      if (selectedScreen?.id === screenId) {
        setSelectedScreen(null);
      }
    } catch (error) {
      console.error("Error archiving screen:", error);
      alert("Failed to archive screen");
    }
  }

  async function handleUpdateScreenTitle(screenId: string, newTitle: string) {
    try {
      await screenActions.updateScreen(screenId, { title: newTitle });
    } catch (error) {
      console.error("Error updating screen title:", error);
      alert("Failed to update screen title");
    }
  }

  async function handleUpdateFlowName(flowId: string, newName: string) {
    try {
      await flowActions.updateFlow(flowId, { name: newName });

      // Update selectedFlow if it's the one being updated
      if (selectedFlow?.id === flowId) {
        setSelectedFlow({ ...selectedFlow, name: newName });
      }
    } catch (error) {
      console.error("Error updating flow name:", error);
      alert("Failed to update flow name");
    }
  }

  async function handleReorderScreens(flowId: string, screens: Screen[]) {
    try {
      const updates = screens.map((screen, index) => ({
        id: screen.id,
        order_index: index,
      }));
      await screenActions.reorderScreens(updates);
    } catch (error) {
      console.error("Error reordering screens:", error);
      alert("Failed to reorder screens");
    }
  }

  async function handleDeleteScreen(screenId: string) {
    try {
      await screenActions.deleteScreen(screenId);

      // Clear selection if deleted screen was selected
      if (selectedScreen?.id === screenId) {
        setSelectedScreen(null);
      }
    } catch (error) {
      console.error("Error deleting screen:", error);
      alert("Failed to delete screen");
    }
  }

  async function handleDeleteFlow(flowId: string) {
    try {
      await flowActions.deleteFlow(flowId);

      // Clear selection if deleted flow was selected
      if (selectedFlow?.id === flowId) {
        setSelectedFlow(null);
        setSelectedScreen(null);
      }
    } catch (error) {
      console.error("Error deleting flow:", error);
      alert("Failed to delete flow");
    }
  }

  async function handleReorderFlows(reorderedFlows: Flow[]) {
    try {
      await flowActions.reorderFlows(
        reorderedFlows.map((flow) => ({
          id: flow.id,
          order_index: flow.order_index,
        }))
      );
    } catch (error) {
      console.error("Error reordering flows:", error);
      alert("Failed to reorder flows");
    }
  }

  async function handleMoveFlowToScreen(
    flowId: string,
    screenId: string | null
  ) {
    try {
      // Check if dropping on a flow (screenId starts with "flow:")
      if (screenId && screenId.startsWith("flow:")) {
        const parentFlowId = screenId.replace("flow:", "");
        await flowActions.updateFlow(flowId, {
          parent_flow_id: parentFlowId,
          parent_screen_id: null,
        });
      } else {
        await flowActions.updateFlow(flowId, {
          parent_screen_id: screenId,
          parent_flow_id: null,
        });
      }
    } catch (error) {
      console.error("Error moving flow:", error);
      alert("Failed to move flow");
    }
  }

  async function handleMoveFlow(
    flowId: string,
    targetId: string | null,
    targetType: "screen" | "flow" | "top-level"
  ) {
    try {
      if (targetType === "top-level") {
        await flowActions.updateFlow(flowId, {
          parent_screen_id: null,
          parent_flow_id: null,
        });
      } else if (targetType === "screen") {
        await flowActions.updateFlow(flowId, {
          parent_screen_id: targetId,
          parent_flow_id: null,
        });
      } else if (targetType === "flow") {
        await flowActions.updateFlow(flowId, {
          parent_flow_id: targetId,
          parent_screen_id: null,
        });
      } else {
        throw new Error("Invalid target type");
      }
    } catch (error) {
      console.error("Error moving flow:", error);
      alert(
        `Failed to move flow: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Handler for screen selection
  function handleSelectScreen(screen: Screen) {
    setSelectedScreen(screen);
    setSelectedFlow(null);
  }

  // Get the display name for the selected flow
  const getFlowDisplayName = (flow: Flow): string => {
    // Check if flow belongs to another flow (child flow)
    if (flow.parent_flow_id) {
      const parentFlow = flows.find((f) => f.id === flow.parent_flow_id);
      if (parentFlow) {
        return `${flow.name} from ${parentFlow.name}`;
      }
    }

    // Check if flow branches from a screen
    if (flow.parent_screen_id) {
      const parentScreen = allScreens.find(
        (s) => s.id === flow.parent_screen_id
      );
      if (parentScreen) {
        return `${flow.name} from ${parentScreen.title}`;
      }
    }

    // Top-level flow
    return flow.name;
  };

  // Show all screens by default (not filtered by flow)
  const displayedScreens = allScreens;

  // Calculate project statistics (must be before conditional returns)
  const projectStats = useMemo(() => {
    return {
      totalScreens: allScreens.length,
      totalFlows: flows.length,
    };
  }, [allScreens, flows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <p className="text-muted-foreground mb-4">
            This project doesn't exist or you don't have access to it.
          </p>
          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg text-left space-y-2">
            <p className="font-semibold">Common reasons:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>You're not logged in</li>
              <li>
                You're not in the right organization (use the org switcher)
              </li>
              <li>The project was deleted</li>
              <li>You don't have permission to view this project</li>
            </ul>
            <p className="mt-4">
              <a href="/dashboard" className="text-primary hover:underline">
                ← Back to Dashboard
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header with project avatar */}
      <Header
        project={localProject || project}
        stats={projectStats}
        onProjectUpdate={(updatedProject) => {
          if (localProject) {
            setLocalProject({ ...localProject, ...updatedProject });
          }
        }}
      />

      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Flow Tree Sidebar - Fixed width */}
        <div className="w-96 flex-shrink-0">
          <FlowSidebar
            flows={flows}
            screensByFlow={screensByFlow}
            onAddFlow={handleAddFlow}
            onAddScreen={openAddScreenDialog}
            onSelectScreen={handleSelectScreen}
            onSelectFlow={(flow) => {
              setSelectedFlow(flow);
              setSelectedScreen(null);
            }}
            onUpdateScreenTitle={handleUpdateScreenTitle}
            onUpdateFlowName={handleUpdateFlowName}
            onAddFlowFromScreen={handleAddFlowFromScreen}
            onDeleteScreen={handleDeleteScreen}
            onDeleteFlow={handleDeleteFlow}
            onReorderScreens={handleReorderScreens}
            onReorderFlows={handleReorderFlows}
            onMoveFlowToScreen={handleMoveFlowToScreen}
            onMoveFlow={handleMoveFlow}
            selectedScreenId={selectedScreen?.id}
            selectedFlowId={selectedFlow?.id}
          />
        </div>

        {/* Main area with tabs - Takes remaining space */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <Tabs defaultValue="screens" className="flex-1 flex flex-col min-h-0">
            <div className="border-b px-6 flex-shrink-0">
              <TabsList className="h-12 bg-transparent">
                <TabsTrigger
                  value="screens"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Screens
                </TabsTrigger>
                <TabsTrigger
                  value="ui-elements"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  UI Elements
                </TabsTrigger>
                <TabsTrigger
                  value="flows"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Flows
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="screens"
              className="flex-1 overflow-auto m-0 min-h-0"
            >
              <ScreenGalleryByFlow
                flows={flows}
                screensByFlow={screensByFlow}
                onSelectScreen={handleSelectScreen}
                onUploadScreenshot={handleUploadScreenshot}
                onAddScreen={openAddScreenDialog}
                onEditScreen={(screen) => {
                  setEditingScreen(screen);
                  setEditScreenDialogOpen(true);
                }}
                onReorderScreens={handleReorderScreens}
                onDeleteScreenshot={handleDeleteScreenshot}
                onArchiveScreen={handleArchiveScreen}
                selectedScreenId={selectedScreen?.id}
                selectedFlowId={selectedFlow?.id}
                platformType={project?.platform_type || 'ios'}
              />
            </TabsContent>

            <TabsContent
              value="ui-elements"
              className="flex-1 overflow-y-auto m-0 min-h-0"
            >
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  UI Elements view coming soon
                </p>
              </div>
            </TabsContent>

            <TabsContent
              value="flows"
              className="flex-1 overflow-y-auto m-0 min-h-0"
            >
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Flows view coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Screen Dialog */}
      {editingScreen && (
        <EditScreenDialog
          open={editScreenDialogOpen}
          onOpenChange={setEditScreenDialogOpen}
          screen={editingScreen}
          availableScreens={screensByFlow.get(editingScreen.flow_id) || []}
          onUpdate={async (updates) => {
            try {
              await screenActions.updateScreen(editingScreen.id, updates);

              // Update selected screen if it's the one being updated
              if (selectedScreen?.id === editingScreen.id) {
                setSelectedScreen({ ...selectedScreen, ...updates });
              }

              setEditScreenDialogOpen(false);
              setEditingScreen(null);
            } catch (error) {
              console.error("Failed to update screen:", error);
              alert("Failed to update screen");
            }
          }}
        />
      )}

      {/* Add Screen Dialog */}
      {addScreenFlowId && (
        <AddScreenDialog
          open={addScreenDialogOpen}
          onOpenChange={setAddScreenDialogOpen}
          onAdd={handleAddScreen}
          availableScreens={screensByFlow.get(addScreenFlowId) || []}
          flowName={flows.find((f) => f.id === addScreenFlowId)?.name || "Flow"}
          defaultParentId={addScreenParentId}
        />
      )}
    </div>
  );
}
