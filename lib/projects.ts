import { supabase } from "./supabase";
import type { Project } from "./database.types";

// Get all projects
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .is("deleted_at", null) // Only get non-deleted projects
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get single project
export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return data;
}

// Create project
export async function createProject(
  name: string,
  description?: string,
  color?: string
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      description,
      color: color || "#3b82f6",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update project
export async function updateProject(
  id: string,
  updates: Partial<Omit<Project, "id" | "created_at" | "updated_at">>
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Soft delete project (and all related data)
export async function deleteProject(id: string): Promise<void> {
  // Start a transaction-like operation by soft-deleting related data first
  // 1. Soft delete all screens in flows belonging to this project
  const { error: screensError } = await supabase
    .from("screens")
    .update({ deleted_at: new Date().toISOString() })
    .in("flow_id", 
      supabase
        .from("flows")
        .select("id")
        .eq("project_id", id)
    );
  
  if (screensError) throw screensError;

  // 2. Soft delete all flows belonging to this project
  const { error: flowsError } = await supabase
    .from("flows")
    .update({ deleted_at: new Date().toISOString() })
    .eq("project_id", id);
  
  if (flowsError) throw flowsError;

  // 3. Soft delete the project itself
  const { error: projectError } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  
  if (projectError) throw projectError;
}
