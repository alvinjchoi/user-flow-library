"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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

  useEffect(() => {
    initializeStorage();
    loadProjectData();
  }, [projectId]);

  async function loadProjectData() {
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

  async function handleAddFlow(parentScreenId?: string) {
    if (!project) return;

    const name = prompt("Flow name:");
    if (!name) return;

    try {
      await createFlow(project.id, name, undefined, parentScreenId);
      await loadProjectData();
    } catch (error) {
      console.error("Error creating flow:", error);
      alert("Failed to create flow");
    }
  }

  async function handleAddFlowFromScreen(screenId: string) {
    const screen = allScreens.find((s) => s.id === screenId);
    if (!screen) return;

    const flowName = prompt(
      `Create a new flow branching from "${screen.title}".\n\nFlow name:`
    );
    if (!flowName) return;

    try {
      await createFlow(project.id, flowName, undefined, screenId);
      await loadProjectData();
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
      // Optimistic update - update local state immediately
      setFlows(reorderedFlows);

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

  // Get the parent screen title for the selected flow
  const getFlowDisplayName = (flow: Flow): string => {
    if (!flow.parent_screen_id) {
      return flow.name;
    }

    const parentScreen = allScreens.find((s) => s.id === flow.parent_screen_id);
    if (parentScreen) {
      return `${flow.name} from ${parentScreen.title}`;
    }

    return flow.name;
  };

  // Show all screens by default (not filtered by flow)
  const displayedScreens = allScreens;

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
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <p className="text-muted-foreground">
            This project doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header with project avatar */}
      <Header project={project} />

      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Flow Tree Sidebar - Fixed width */}
        <div className="w-96 flex-shrink-0">
          <FlowSidebar
            flows={flows}
            screensByFlow={screensByFlow}
            onAddFlow={() => handleAddFlow()}
            onAddScreen={openAddScreenDialog}
            onSelectScreen={setSelectedScreen}
            onSelectFlow={setSelectedFlow}
            onUpdateScreenTitle={handleUpdateScreenTitle}
            onAddFlowFromScreen={handleAddFlowFromScreen}
            onDeleteScreen={handleDeleteScreen}
            onDeleteFlow={handleDeleteFlow}
            onReorderScreens={handleReorderScreens}
            onReorderFlows={handleReorderFlows}
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
                onSelectScreen={setSelectedScreen}
                onUploadScreenshot={handleUploadScreenshot}
                onAddScreen={openAddScreenDialog}
                onEditScreen={(screen) => {
                  setEditingScreen(screen);
                  setEditScreenDialogOpen(true);
                }}
                selectedScreenId={selectedScreen?.id}
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
          flowName={
            flows.find((f) => f.id === editingScreen.flow_id)?.name || "Flow"
          }
          onUpdate={async (updates) => {
            try {
              await updateScreen(editingScreen.id, updates);
              await loadProjectData();
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
