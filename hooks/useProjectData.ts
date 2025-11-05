import { useState, useEffect, useCallback } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { getProject, getFlowsByProject } from "@/lib/projects";
import { getScreensByFlow } from "@/lib/flows";
import type { Project, Flow, Screen } from "@/lib/database.types";

export interface UseProjectDataResult {
  project: Project | null;
  flows: Flow[];
  screensByFlow: Map<string, Screen[]>;
  allScreens: Screen[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to load and manage project data
 * Handles authentication and data fetching for projects, flows, and screens
 */
export function useProjectData(projectId: string): UseProjectDataResult {
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();

  const [project, setProject] = useState<Project | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [screensByFlow, setScreensByFlow] = useState<Map<string, Screen[]>>(
    new Map()
  );
  const [allScreens, setAllScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    // Wait for auth to be ready
    if (!userLoaded || !orgLoaded) {
      console.log("[useProjectData] Waiting for auth to load...");
      return;
    }

    console.log("[useProjectData] Loading project data:", {
      projectId,
      userId: user?.id,
      orgId: organization?.id,
      orgName: organization?.name,
    });

    try {
      setLoading(true);
      setError(null);

      // Load project
      const proj = await getProject(projectId);
      if (!proj) {
        throw new Error("Project not found");
      }
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

      console.log("[useProjectData] Successfully loaded:", {
        project: proj.name,
        flowsCount: flowsData.length,
        screensCount: allScreensList.length,
      });
    } catch (err) {
      console.error("[useProjectData] Error loading project data:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to load project data")
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, userLoaded, orgLoaded, user?.id, organization?.id]);

  // Load data when projectId or auth changes
  useEffect(() => {
    if (userLoaded && orgLoaded) {
      loadData();
    }
  }, [loadData, userLoaded, orgLoaded]);

  return {
    project,
    flows,
    screensByFlow,
    allScreens,
    loading,
    error,
    refetch: loadData,
  };
}

/**
 * Custom hook for managing flow selection
 */
export function useFlowSelection(flows: Flow[]) {
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);

  // Auto-select first flow when flows change
  useEffect(() => {
    if (flows.length > 0 && !selectedFlow) {
      setSelectedFlow(flows[0]);
    }
  }, [flows, selectedFlow]);

  return {
    selectedFlow,
    setSelectedFlow,
  };
}

/**
 * Custom hook for managing screen selection
 */
export function useScreenSelection() {
  const [selectedScreen, setSelectedScreen] = useState<Screen | null>(null);

  const clearSelection = useCallback(() => {
    setSelectedScreen(null);
  }, []);

  return {
    selectedScreen,
    setSelectedScreen,
    clearSelection,
  };
}

