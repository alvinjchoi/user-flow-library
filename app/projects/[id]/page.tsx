"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, Copy, MoreHorizontal, Plus, ArrowLeft } from "lucide-react";
import { getProject } from "@/lib/projects";
import {
  getFlowsByProject,
  getScreensByFlow,
  createFlow,
  createScreen,
  updateScreen,
  reorderScreens,
} from "@/lib/flows";
import type { Project, Flow, Screen } from "@/lib/database.types";
import { FlowSidebar } from "@/components/flow-tree/flow-sidebar";
import { ScreenGallery } from "@/components/screens/screen-gallery";
import { UploadDialog } from "@/components/screens/upload-dialog";
import { AddScreenDialog } from "@/components/screens/add-screen-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { initializeStorage } from "@/lib/storage";

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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingScreenId, setUploadingScreenId] = useState<string | null>(
    null
  );
  const [addScreenDialogOpen, setAddScreenDialogOpen] = useState(false);
  const [addScreenFlowId, setAddScreenFlowId] = useState<string | null>(null);
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
    setAddScreenDialogOpen(true);
  }

  async function handleAddScreen(title: string, parentId?: string) {
    if (!addScreenFlowId) return;

    try {
      // Create the new screen (it will be added at the end automatically)
      const newScreen = await createScreen(addScreenFlowId, title, parentId);

      // Optimistic update - add to local state immediately
      const flowScreens = screensByFlow.get(addScreenFlowId) || [];
      const updatedFlowScreens = [...flowScreens, newScreen];

      const updatedScreensByFlow = new Map(screensByFlow);
      updatedScreensByFlow.set(addScreenFlowId, updatedFlowScreens);

      const updatedAllScreens = [...allScreens, newScreen];

      setScreensByFlow(updatedScreensByFlow);
      setAllScreens(updatedAllScreens);

      // Reload to get the updated screen count on flows
      await loadProjectData();
    } catch (error) {
      console.error("Error creating screen:", error);
      alert("Failed to create screen");
    }
  }

  function handleUploadScreenshot(screenId: string) {
    setUploadingScreenId(screenId);
    setUploadDialogOpen(true);
  }

  async function handleUploadComplete(url: string) {
    if (!uploadingScreenId) return;

    // Optimistic update - update local state immediately without reload
    const updatedScreensByFlow = new Map(screensByFlow);
    const updatedAllScreens = allScreens.map((s) =>
      s.id === uploadingScreenId ? { ...s, screenshot_url: url } : s
    );

    // Update each flow's screens
    for (const [flowId, screens] of screensByFlow.entries()) {
      const updatedScreens = screens.map((s) =>
        s.id === uploadingScreenId ? { ...s, screenshot_url: url } : s
      );
      updatedScreensByFlow.set(flowId, updatedScreens);
    }

    setScreensByFlow(updatedScreensByFlow);
    setAllScreens(updatedAllScreens);

    // Close the dialog
    setUploadDialogOpen(false);
    setUploadingScreenId(null);
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

  // Get screens for the selected flow
  const displayedScreens = selectedFlow
    ? screensByFlow.get(selectedFlow.id) || []
    : allScreens;

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
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-20">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div
              className="w-8 h-8 rounded-lg"
              style={{ backgroundColor: project.color }}
            />
            <div>
              <h1 className="font-semibold">{project.name}</h1>
              {project.description && (
                <p className="text-xs text-muted-foreground">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="default">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Flow Tree Sidebar */}
        <FlowSidebar
          flows={flows}
          screensByFlow={screensByFlow}
          onAddFlow={() => handleAddFlow()}
          onAddScreen={openAddScreenDialog}
          onSelectScreen={setSelectedScreen}
          onSelectFlow={setSelectedFlow}
          onUpdateScreenTitle={handleUpdateScreenTitle}
          onAddFlowFromScreen={handleAddFlowFromScreen}
          onReorderScreens={handleReorderScreens}
          selectedScreenId={selectedScreen?.id}
          selectedFlowId={selectedFlow?.id}
        />

        {/* Main area with tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="screens" className="flex-1 flex flex-col">
            <div className="border-b px-6">
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

            <TabsContent value="screens" className="flex-1 overflow-auto m-0">
              {selectedFlow && (
                <div className="border-b bg-background px-6 py-4">
                  <h2 className="text-xl font-semibold">
                    {getFlowDisplayName(selectedFlow)}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {displayedScreens.length} screen
                    {displayedScreens.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
              <ScreenGallery
                screens={displayedScreens}
                onSelectScreen={setSelectedScreen}
                onUploadScreenshot={handleUploadScreenshot}
                onAddScreen={() =>
                  selectedFlow && openAddScreenDialog(selectedFlow.id)
                }
                selectedScreenId={selectedScreen?.id}
              />
            </TabsContent>

            <TabsContent
              value="ui-elements"
              className="flex-1 overflow-y-auto m-0"
            >
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  UI Elements view coming soon
                </p>
              </div>
            </TabsContent>

            <TabsContent value="flows" className="flex-1 overflow-y-auto m-0">
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Flows view coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Upload Dialog */}
      {uploadingScreenId && (
        <UploadDialog
          screenId={uploadingScreenId}
          screenTitle={
            allScreens.find((s) => s.id === uploadingScreenId)?.title || ""
          }
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onUploadComplete={handleUploadComplete}
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
        />
      )}
    </div>
  );
}
