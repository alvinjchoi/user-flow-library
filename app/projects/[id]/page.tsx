"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { getProject } from "@/lib/projects";
import {
  getFlowsByProject,
  getScreensByFlow,
  createFlow,
  createScreen,
  updateScreen,
  reorderScreens,
  deleteScreen,
  deleteFlow,
  reorderFlows,
  updateFlow,
} from "@/lib/flows";
import type { Project, Flow, Screen } from "@/lib/database.types";
import { FlowSidebar } from "@/components/flow-tree/flow-sidebar";
import { ScreenGalleryByFlow } from "@/components/screens/screen-gallery-by-flow";
import { EditScreenDialog } from "@/components/screens/edit-screen-dialog";
import { AddScreenDialog } from "@/components/screens/add-screen-dialog";
import { Header } from "@/components/header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { initializeStorage, uploadScreenshot } from "@/lib/storage";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();

  const [project, setProject] = useState<Project | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [screensByFlow, setScreensByFlow] = useState<Map<string, Screen[]>>(
    new Map()
  );
  const [allScreens, setAllScreens] = useState<Screen[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<Screen | null>(null);
  const [editScreenDialogOpen, setEditScreenDialogOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [addScreenDialogOpen, setAddScreenDialogOpen] = useState(false);
  const [addScreenFlowId, setAddScreenFlowId] = useState<string | null>(null);
  const [addScreenParentId, setAddScreenParentId] = useState<
    string | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);

  // Set page title based on project name
  useEffect(() => {
    if (project) {
      document.title = `User Flow Library | ${project.name}`;
    }
  }, [project]);

  useEffect(() => {
    initializeStorage();
    // Only load project data when Clerk is ready
    if (userLoaded && orgLoaded) {
      loadProjectData();
    }
  }, [projectId, userLoaded, orgLoaded]);

  async function loadProjectData() {
    // Double-check auth is loaded before proceeding
    if (!userLoaded || !orgLoaded) {
      console.log("[ProjectPage] Waiting for auth to load...");
      return;
    }

    console.log("[ProjectPage] Loading project data with auth:", {
      userId: user?.id,
      orgId: organization?.id,
      orgName: organization?.name,
    });

    try {
      setLoading(true);

      // Load project
      const proj = await getProject(projectId);
      setProject(proj);

      // Load flows
      const flowsData = await getFlowsByProject(projectId);
      setFlows(flowsData);

      // Load screens for each flow
      const screensMap = new Map<string, Screen[]>();
      const allScreensList: Screen[] = [];

      for (const flow of flowsData) {
        const screens = await getScreensByFlow(flow.id);
        screensMap.set(flow.id, screens);
        allScreensList.push(...screens);
      }

      setScreensByFlow(screensMap);
      setAllScreens(allScreensList);

      // Select first flow by default
      if (flowsData.length > 0) {
        setSelectedFlow(flowsData[0]);
      }
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
    }
  }

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
      // Create the flow in database
      const newFlow = await createFlow(
        project.id,
        name,
        undefined,
        undefined,
        parentFlowId
      );

      // Optimistic update - add to local state immediately
      setFlows((prevFlows) => [...prevFlows, newFlow]);

      // Initialize empty screens array for this flow
      setScreensByFlow((prev) => {
        const updated = new Map(prev);
        updated.set(newFlow.id, []);
        return updated;
      });
    } catch (error) {
      console.error("Error creating flow:", error);
      alert("Failed to create flow");
      // Reload on error to ensure consistency
      await loadProjectData();
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
      // Create the flow in database
      const newFlow = await createFlow(
        project.id,
        flowName,
        undefined,
        screenId
      );

      // Optimistic update - add to local state immediately
      setFlows((prevFlows) => [...prevFlows, newFlow]);

      // Initialize empty screens array for this flow
      setScreensByFlow((prev) => {
        const updated = new Map(prev);
        updated.set(newFlow.id, []);
        return updated;
      });
    } catch (error) {
      console.error("Error creating flow from screen:", error);
      alert("Failed to create flow");
      // Reload on error to ensure consistency
      await loadProjectData();
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
      // Create the screen first with description and display name
      const newScreen = await createScreen(
        addScreenFlowId,
        title,
        parentId,
        description,
        displayName
      );

      // If there's a screenshot file, upload it
      if (screenshotFile) {
        try {
          const screenshotUrl = await uploadScreenshot(
            screenshotFile,
            newScreen.id
          );
          if (screenshotUrl) {
            // Update the screen with the screenshot URL
            await updateScreen(newScreen.id, { screenshot_url: screenshotUrl });

            // Update local state with screenshot URL
            const updatedScreen = {
              ...newScreen,
              screenshot_url: screenshotUrl,
            };
            const updatedScreensByFlow = new Map(screensByFlow);
            const flowScreens = updatedScreensByFlow.get(addScreenFlowId) || [];
            updatedScreensByFlow.set(addScreenFlowId, [
              ...flowScreens,
              updatedScreen,
            ]);
            setScreensByFlow(updatedScreensByFlow);
            setAllScreens((prev) => [...prev, updatedScreen]);
          }
        } catch (uploadError) {
          console.error("Error uploading screenshot:", uploadError);
          // Still add the screen without screenshot
          const updatedScreensByFlow = new Map(screensByFlow);
          const flowScreens = updatedScreensByFlow.get(addScreenFlowId) || [];
          updatedScreensByFlow.set(addScreenFlowId, [
            ...flowScreens,
            newScreen,
          ]);
          setScreensByFlow(updatedScreensByFlow);
          setAllScreens((prev) => [...prev, newScreen]);
        }
      } else {
        // No screenshot, just add the screen
        const updatedScreensByFlow = new Map(screensByFlow);
        const flowScreens = updatedScreensByFlow.get(addScreenFlowId) || [];
        updatedScreensByFlow.set(addScreenFlowId, [...flowScreens, newScreen]);
        setScreensByFlow(updatedScreensByFlow);
        setAllScreens((prev) => [...prev, newScreen]);
      }

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
      // Update the screen to remove screenshot_url
      await updateScreen(screenId, { screenshot_url: null });

      // Update local state
      const updatedScreensByFlow = new Map(screensByFlow);
      const updatedAllScreens = allScreens.map((s) =>
        s.id === screenId ? { ...s, screenshot_url: null } : s
      );

      // Update each flow's screens
      for (const [flowId, screens] of screensByFlow.entries()) {
        const updatedScreens = screens.map((s) =>
          s.id === screenId ? { ...s, screenshot_url: null } : s
        );
        updatedScreensByFlow.set(flowId, updatedScreens);
      }

      setScreensByFlow(updatedScreensByFlow);
      setAllScreens(updatedAllScreens);
    } catch (error) {
      console.error("Error deleting screenshot:", error);
      throw error;
    }
  }

  async function handleArchiveScreen(screenId: string) {
    try {
      // Delete the screen (hard delete for now - can be changed to soft delete later)
      await deleteScreen(screenId);

      // Update local state - remove screen from all lists
      const updatedScreensByFlow = new Map(screensByFlow);
      const updatedAllScreens = allScreens.filter((s) => s.id !== screenId);

      // Remove from each flow's screens
      for (const [flowId, screens] of screensByFlow.entries()) {
        const updatedScreens = screens.filter((s) => s.id !== screenId);
        updatedScreensByFlow.set(flowId, updatedScreens);
      }

      setScreensByFlow(updatedScreensByFlow);
      setAllScreens(updatedAllScreens);

      // Clear selection if archived screen was selected
      if (selectedScreen?.id === screenId) {
        setSelectedScreen(null);
      }
    } catch (error) {
      console.error("Error archiving screen:", error);
      throw error;
    }
  }

  async function handleUpdateScreenTitle(screenId: string, newTitle: string) {
    try {
      // Optimistic update - update local state immediately
      const updatedScreensByFlow = new Map(screensByFlow);
      const updatedAllScreens = allScreens.map((s) =>
        s.id === screenId ? { ...s, title: newTitle } : s
      );

      // Update each flow's screens
      for (const [flowId, screens] of screensByFlow.entries()) {
        const updatedScreens = screens.map((s) =>
          s.id === screenId ? { ...s, title: newTitle } : s
        );
        updatedScreensByFlow.set(flowId, updatedScreens);
      }

      setScreensByFlow(updatedScreensByFlow);
      setAllScreens(updatedAllScreens);

      // Update in background
      await updateScreen(screenId, { title: newTitle });
    } catch (error) {
      console.error("Error updating screen title:", error);
      alert("Failed to update screen title");
      // Revert on error
      await loadProjectData();
    }
  }

  async function handleUpdateFlowName(flowId: string, newName: string) {
    try {
      // Optimistic update - update local state immediately
      const updatedFlows = flows.map((f) =>
        f.id === flowId ? { ...f, name: newName } : f
      );
      setFlows(updatedFlows);

      // Update selectedFlow if it's the one being updated
      if (selectedFlow?.id === flowId) {
        setSelectedFlow({ ...selectedFlow, name: newName });
      }

      // Update in background
      await updateFlow(flowId, { name: newName });
    } catch (error) {
      console.error("Error updating flow name:", error);
      alert("Failed to update flow name");
      // Revert on error
      await loadProjectData();
    }
  }

  async function handleReorderScreens(flowId: string, screens: Screen[]) {
    try {
      // Optimistic update - update local state immediately
      const updatedScreensByFlow = new Map(screensByFlow);

      // Update order_index for the reordered screens
      const reorderedWithIndex = screens.map((screen, index) => ({
        ...screen,
        order_index: index,
      }));

      updatedScreensByFlow.set(flowId, reorderedWithIndex);

      // Update allScreens as well
      const updatedAllScreens = allScreens.map((screen) => {
        if (screen.flow_id === flowId) {
          const reordered = reorderedWithIndex.find((s) => s.id === screen.id);
          return reordered || screen;
        }
        return screen;
      });

      setScreensByFlow(updatedScreensByFlow);
      setAllScreens(updatedAllScreens);

      // Update in background
      const updates = screens.map((screen, index) => ({
        id: screen.id,
        order_index: index,
      }));
      await reorderScreens(updates);
    } catch (error) {
      console.error("Error reordering screens:", error);
      alert("Failed to reorder screens");
      // Revert on error
      await loadProjectData();
    }
  }

  async function handleDeleteScreen(screenId: string) {
    try {
      // Optimistic update - remove from local state immediately
      const updatedScreensByFlow = new Map(screensByFlow);
      const updatedAllScreens = allScreens.filter((s) => s.id !== screenId);

      // Update each flow's screens
      for (const [flowId, screens] of screensByFlow.entries()) {
        const updatedScreens = screens.filter((s) => s.id !== screenId);
        updatedScreensByFlow.set(flowId, updatedScreens);
      }

      setScreensByFlow(updatedScreensByFlow);
      setAllScreens(updatedAllScreens);

      // Clear selection if deleted screen was selected
      if (selectedScreen?.id === screenId) {
        setSelectedScreen(null);
      }

      // Delete from database in background
      await deleteScreen(screenId);
    } catch (error) {
      console.error("Error deleting screen:", error);
      alert("Failed to delete screen");
      // Revert on error
      await loadProjectData();
    }
  }

  async function handleDeleteFlow(flowId: string) {
    try {
      // Optimistic update - remove flow and its screens from local state
      const updatedFlows = flows.filter((f) => f.id !== flowId);
      const updatedScreensByFlow = new Map(screensByFlow);
      updatedScreensByFlow.delete(flowId);
      const updatedAllScreens = allScreens.filter((s) => s.flow_id !== flowId);

      setFlows(updatedFlows);
      setScreensByFlow(updatedScreensByFlow);
      setAllScreens(updatedAllScreens);

      // Clear selection if deleted flow was selected
      if (selectedFlow?.id === flowId) {
        setSelectedFlow(null);
        setSelectedScreen(null);
      }

      // Delete from database in background
      await deleteFlow(flowId);
    } catch (error) {
      console.error("Error deleting flow:", error);
      alert("Failed to delete flow");
      // Revert on error
      await loadProjectData();
    }
  }

  async function handleReorderFlows(reorderedFlows: Flow[]) {
    try {
      // Optimistic update - merge reordered flows with existing flows
      setFlows((prevFlows) => {
        const flowMap = new Map(prevFlows.map((f) => [f.id, f]));

        // Update the flows that were reordered
        reorderedFlows.forEach((flow) => {
          flowMap.set(flow.id, flow);
        });

        return Array.from(flowMap.values());
      });

      // Update database in background
      await reorderFlows(
        reorderedFlows.map((flow) => ({
          id: flow.id,
          order_index: flow.order_index,
        }))
      );
    } catch (error) {
      console.error("Error reordering flows:", error);
      alert("Failed to reorder flows");
      // Revert on error
      await loadProjectData();
    }
  }

  async function handleMoveFlowToScreen(
    flowId: string,
    screenId: string | null
  ) {
    try {
      let updatedFlow: Flow;

      // Check if dropping on a flow (screenId starts with "flow:")
      if (screenId && screenId.startsWith("flow:")) {
        const parentFlowId = screenId.replace("flow:", "");
        // Update the flow's parent_flow_id
        updatedFlow = await updateFlow(flowId, {
          parent_flow_id: parentFlowId,
          parent_screen_id: null,
        });
      } else {
        // Update the flow's parent_screen_id
        updatedFlow = await updateFlow(flowId, {
          parent_screen_id: screenId,
          parent_flow_id: null,
        });
      }

      // Optimistic update: Update local state immediately without full reload
      setFlows((prevFlows) =>
        prevFlows.map((flow) => (flow.id === flowId ? updatedFlow : flow))
      );
    } catch (error) {
      console.error("Error moving flow:", error);
      alert("Failed to move flow");

      // On error, reload to ensure consistency
      await loadProjectData();
    }
  }

  async function handleMoveFlow(
    flowId: string,
    targetId: string | null,
    targetType: "screen" | "flow" | "top-level"
  ) {
    try {
      let updatedFlow: Flow;
      if (targetType === "top-level") {
        // Make it a top-level flow
        updatedFlow = await updateFlow(flowId, {
          parent_screen_id: null,
          parent_flow_id: null,
        });
      } else if (targetType === "screen") {
        // Move to branch from a screen
        updatedFlow = await updateFlow(flowId, {
          parent_screen_id: targetId,
          parent_flow_id: null,
        });
      } else if (targetType === "flow") {
        // Move to nest under another flow
        updatedFlow = await updateFlow(flowId, {
          parent_flow_id: targetId,
          parent_screen_id: null,
        });
      } else {
        throw new Error("Invalid target type");
      }

      // Optimistic update: Update local state immediately without full reload
      setFlows((prevFlows) =>
        prevFlows.map((flow) => (flow.id === flowId ? updatedFlow : flow))
      );
    } catch (error) {
      console.error("Error moving flow:", error);
      alert(
        `Failed to move flow: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      // On error, reload to ensure consistency
      await loadProjectData();
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
        project={project}
        stats={projectStats}
        onProjectUpdate={(updatedProject) =>
          setProject({ ...project, ...updatedProject })
        }
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
              // Optimistic update - update local state immediately
              const updatedScreensByFlow = new Map(screensByFlow);
              const updatedAllScreens = allScreens.map((s) =>
                s.id === editingScreen.id ? { ...s, ...updates } : s
              );

              // Update each flow's screens
              for (const [flowId, screens] of screensByFlow.entries()) {
                const updatedScreens = screens.map((s) =>
                  s.id === editingScreen.id ? { ...s, ...updates } : s
                );
                updatedScreensByFlow.set(flowId, updatedScreens);
              }

              setScreensByFlow(updatedScreensByFlow);
              setAllScreens(updatedAllScreens);

              // Update selected screen if it's the one being updated
              if (selectedScreen?.id === editingScreen.id) {
                setSelectedScreen({ ...selectedScreen, ...updates });
              }

              setEditScreenDialogOpen(false);
              setEditingScreen(null);

              // Update in background
              await updateScreen(editingScreen.id, updates);
            } catch (error) {
              console.error("Failed to update screen:", error);
              alert("Failed to update screen");
              // Revert on error
              await loadProjectData();
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
