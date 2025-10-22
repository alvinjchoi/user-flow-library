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
  orderIndex?: number
): Promise<Screen> {
  // If no order index provided, get the max order_index for this flow
  let finalOrderIndex = orderIndex;

  if (finalOrderIndex === undefined) {
    const { data: existingScreens } = await supabase
      .from("screens")
      .select("order_index")
      .eq("flow_id", flowId)
      .order("order_index", { ascending: false })
      .limit(1);

    finalOrderIndex =
      existingScreens && existingScreens.length > 0
        ? existingScreens[0].order_index + 1
        : 0;
  }

  const { data, error } = await supabase
    .from("screens")
    .insert({
      flow_id: flowId,
      title,
      parent_id: parentId || null,
      order_index: finalOrderIndex,
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
