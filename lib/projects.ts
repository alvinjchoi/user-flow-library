import { supabase } from "./supabase";
import type { Project } from "./database.types";

// Get all projects
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
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

// Delete project
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}
