"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Project, Flow, Screen } from "@/lib/database.types";
import { FlowSidebar } from "@/components/flow-tree/flow-sidebar";
import { ScreenGalleryByFlow } from "@/components/screens/screen-gallery-by-flow";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Image from "next/image";
import { Search, Lock } from "lucide-react";

// Create Supabase client
const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

export default function SharePage() {
  const params = useParams();
  const shareToken = params.token as string;

  const [project, setProject] = useState<Project | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [screensByFlow, setScreensByFlow] = useState<Map<string, Screen[]>>(
    new Map()
  );
  const [allScreens, setAllScreens] = useState<Screen[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<Screen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSharedProject();
  }, [shareToken]);

  async function loadSharedProject() {
    if (!supabase) {
      setError("Database not configured");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get project by share token
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("share_token", shareToken)
        .eq("is_public", true)
        .single();

      if (projectError || !projectData) {
        setError("This project is not available or the link has expired");
        setLoading(false);
        return;
      }

      setProject(projectData);

      // Load flows
      const { data: flowsData, error: flowsError } = await supabase
        .from("flows")
        .select("*")
        .eq("project_id", projectData.id)
        .order("order_index");

      if (flowsError) {
        console.error("Error loading flows:", flowsError);
        setError("Failed to load project flows");
        setLoading(false);
        return;
      }

      setFlows(flowsData || []);

      // Load screens for each flow
      const screensMap = new Map<string, Screen[]>();
      const allScreensList: Screen[] = [];

      for (const flow of flowsData || []) {
        const { data: screensData, error: screensError } = await supabase
          .from("screens")
          .select("*")
          .eq("flow_id", flow.id)
          .order("order_index");

        if (!screensError && screensData) {
          screensMap.set(flow.id, screensData);
          allScreensList.push(...screensData);
        }
      }

      setScreensByFlow(screensMap);
      setAllScreens(allScreensList);

      // Select first flow by default
      if (flowsData && flowsData.length > 0) {
        setSelectedFlow(flowsData[0]);
      }
    } catch (err) {
      console.error("Error loading shared project:", err);
      setError("Failed to load shared project");
    } finally {
      setLoading(false);
    }
  }

  // Handler for screen selection
  function handleSelectScreen(screen: Screen) {
    setSelectedScreen(screen);
    setSelectedFlow(null);
  }

  // Calculate project statistics
  const projectStats = {
    totalScreens: allScreens.length,
    totalFlows: flows.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading shared project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">
            {error || "Project not found"}
          </h2>
          <p className="text-muted-foreground">
            This link may have expired or the project is no longer shared.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header (Read-only view) */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
                {project.avatar_url ? (
                  <Image
                    src={project.avatar_url}
                    alt={`${project.name} avatar`}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Search className="w-5 h-5 text-primary-foreground" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold">{project.name}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {projectStats.totalScreens} screen
                    {projectStats.totalScreens !== 1 ? "s" : ""}
                  </span>
                  <span className="text-muted-foreground/40">•</span>
                  <span>
                    {projectStats.totalFlows} flow
                    {projectStats.totalFlows !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
              Read-only view
            </span>
          </div>
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Flow Tree Sidebar - Fixed width (read-only) */}
        <div className="w-96 flex-shrink-0">
          <FlowSidebar
            flows={flows}
            screensByFlow={screensByFlow}
            onAddFlow={() => {}}
            onAddScreen={() => {}}
            onSelectScreen={handleSelectScreen}
            onSelectFlow={(flow) => {
              setSelectedFlow(flow);
              setSelectedScreen(null);
            }}
            onUpdateScreenTitle={() => {}}
            onUpdateFlowName={() => {}}
            onAddFlowFromScreen={() => {}}
            onDeleteScreen={() => {}}
            onDeleteFlow={() => {}}
            onReorderScreens={() => {}}
            onReorderFlows={() => {}}
            onMoveFlowToScreen={() => {}}
            onMoveFlow={() => {}}
            selectedScreenId={selectedScreen?.id}
            selectedFlowId={selectedFlow?.id}
            readOnly={true}
          />
        </div>

        {/* Main area with tabs */}
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
                onUploadScreenshot={() => {}}
                onAddScreen={() => {}}
                onEditScreen={() => {}}
                selectedScreenId={selectedScreen?.id}
                selectedFlowId={selectedFlow?.id}
                readOnly={true}
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
    </div>
  );
}

