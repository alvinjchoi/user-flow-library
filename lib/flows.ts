import { supabase } from "./supabase";
import type { Flow, Screen } from "./database.types";

// Get all flows for a project
export async function getFlowsByProject(projectId: string): Promise<Flow[]> {
  const { data, error } = await supabase
    .from("flows")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index");

  if (error) throw error;
  return data || [];
}

// Get screens for a flow (with tree structure)
export async function getScreensByFlow(flowId: string): Promise<Screen[]> {
  const { data, error } = await supabase
    .from("screens")
    .select("*")
    .eq("flow_id", flowId)
    .order("order_index");

  if (error) throw error;
  return data || [];
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
  console.log("Creating flow with params:", { projectId, name, description, parentScreenId });
  
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

  if (error) {
    console.error("Error creating flow:", error);
    throw error;
  }
  
  console.log("Successfully created flow:", data);
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
