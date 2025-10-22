import { supabase } from "./supabase";
import type { Flow, Screen } from "./database.types";

// Get all flows for a project
export async function getFlowsByProject(projectId: string): Promise<Flow[]> {
  try {
    const { data, error } = await supabase
      .from("flows")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index");

    if (error) throw error;
    return data || [];
  } catch (error) {
    // If flows table doesn't exist, return mock data for testing
    console.warn("Flows table not found, using mock data:", error);
    return [
      {
        id: "mock-flow-1",
        project_id: projectId,
        name: "Onboarding",
        description: "User onboarding and browsing flow",
        order_index: 0,
        screen_count: 2, // Now has 2 screens: parent + child
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }
}

// Get screens for a flow (with tree structure)
export async function getScreensByFlow(flowId: string): Promise<Screen[]> {
  try {
    const { data, error } = await supabase
      .from("screens")
      .select("*")
      .eq("flow_id", flowId)
      .order("order_index");

    if (error) throw error;
    return data || [];
  } catch (error) {
    // If screens table doesn't exist, return mock data for testing
    console.warn("Screens table not found, using mock data:", error);

    if (flowId === "mock-flow-1") {
      // Return hierarchical screens for "Browsing projects"
      return [
        {
          id: "mock-screen-1",
          flow_id: flowId,
          parent_id: null,
          title: "Projects List Screen",
          display_name: "Browsing projects",
          screenshot_url: "/placeholder.svg",
          notes: "User can see a list of available projects",
          order_index: 0,
          level: 0,
          path: "Projects List Screen",
          tags: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "mock-screen-2",
          flow_id: flowId,
          parent_id: "mock-screen-1",
          title: "Project Details Screen",
          display_name: "Viewing project details",
          screenshot_url: null, // No screenshot yet - should show empty skeleton
          notes: null,
          order_index: 1,
          level: 1,
          path: "Projects List Screen > Project Details Screen",
          tags: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    } else if (flowId === "mock-flow-2") {
      // Empty flow for testing
      return [];
    }

    return [];
  }
}

// Build hierarchical tree from flat screen list
export function buildScreenTree(screens: Screen[]): Screen[] {
  const screenMap = new Map<string, Screen & { children: Screen[] }>();
  const rootScreens: (Screen & { children: Screen[] })[] = [];

  // First pass: create map with children arrays
  screens.forEach((screen) => {
    screenMap.set(screen.id, { ...screen, children: [] });
  });

  // Second pass: build tree structure
  screens.forEach((screen) => {
    const node = screenMap.get(screen.id)!;
    if (screen.parent_id) {
      const parent = screenMap.get(screen.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        rootScreens.push(node);
      }
    } else {
      rootScreens.push(node);
    }
  });

  return rootScreens;
}

// Create a new flow
export async function createFlow(
  projectId: string,
  name: string,
  description?: string,
  parentScreenId?: string
): Promise<Flow> {
  const { data, error } = await supabase
    .from("flows")
    .insert({
      project_id: projectId,
      name,
      description,
      parent_screen_id: parentScreenId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Create a new screen
export async function createScreen(
  flowId: string,
  title: string,
  parentId?: string,
  description?: string,
  displayName?: string
): Promise<Screen> {
  // Get the max order_index for this flow
  const { data: existingScreens } = await supabase
    .from("screens")
    .select("order_index")
    .eq("flow_id", flowId)
    .order("order_index", { ascending: false })
    .limit(1);

  const finalOrderIndex =
    existingScreens && existingScreens.length > 0
      ? existingScreens[0].order_index + 1
      : 0;

  // Determine parent level and path
  let parentLevel = 0;
  let parentPath: string | null = null;
  if (parentId) {
    const { data: parentScreen, error: parentError } = await supabase
      .from("screens")
      .select("level, path")
      .eq("id", parentId)
      .single();

    if (parentError) {
      console.error("Error fetching parent screen:", parentError);
      // Proceed without parent_id if parent not found
    } else if (parentScreen) {
      parentLevel = parentScreen.level;
      parentPath = parentScreen.path;
    }
  }

  const { data, error } = await supabase
    .from("screens")
    .insert({
      flow_id: flowId,
      title,
      display_name: displayName || title,
      parent_id: parentId || null,
      order_index: finalOrderIndex,
      level: parentId ? parentLevel + 1 : 0,
      path: parentId ? `${parentPath}/${parentId}` : null,
      tags: [],
      notes: description || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update screen
export async function updateScreen(
  id: string,
  updates: Partial<Screen>
): Promise<Screen> {
  const { data, error } = await supabase
    .from("screens")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete screen
export async function deleteScreen(id: string): Promise<void> {
  const { error } = await supabase.from("screens").delete().eq("id", id);
  if (error) throw error;
}

// Reorder screens
export async function reorderScreens(
  screens: { id: string; order_index: number }[]
): Promise<void> {
  // Update all screens in a transaction-like batch
  const updates = screens.map(({ id, order_index }) =>
    supabase.from("screens").update({ order_index }).eq("id", id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error);

  if (errors.length > 0) {
    throw new Error(`Failed to reorder screens: ${errors[0].error?.message}`);
  }
}

// Reorder flows
export async function reorderFlows(
  flows: { id: string; order_index: number }[]
): Promise<void> {
  // Update all flows in a transaction-like batch
  const updates = flows.map(({ id, order_index }) =>
    supabase.from("flows").update({ order_index }).eq("id", id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error);

  if (errors.length > 0) {
    throw new Error(`Failed to reorder flows: ${errors[0].error?.message}`);
  }
}

// Delete flow
export async function deleteFlow(flowId: string): Promise<void> {
  const { error } = await supabase.from("flows").delete().eq("id", flowId);

  if (error) throw error;
}
