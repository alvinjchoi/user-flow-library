import { supabase } from "./supabase";
import type { Project } from "./database.types";
import { uploadFile } from "./storage";
import { auth } from "@clerk/nextjs/server";

// Get all projects for the current user or organization
export async function getProjects(): Promise<Project[]> {
  const { userId, orgId } = await auth();

  if (!userId && !orgId) {
    return []; // No authenticated user or organization
  }

  let query = supabase
    .from("projects")
    .select("*")
    .is("deleted_at", null);

  if (orgId) {
    // If in an organization context, get org projects
    query = query.eq("clerk_org_id", orgId);
  } else if (userId) {
    // If personal context, get user's personal projects
    query = query.eq("user_id", userId);
  } else {
    return [];
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get single project
export async function getProject(id: string): Promise<Project | null> {
  const { userId, orgId } = await auth();

  if (!userId && !orgId) {
    return null; // No authenticated user or organization
  }

  let query = supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

  // Ensure user can only access their own projects or projects from their organization
  if (orgId) {
    query = query.eq("clerk_org_id", orgId);
  } else if (userId) {
    query = query.eq("user_id", userId);
  } else {
    return null;
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found or no access
    throw error;
  }
  return data;
}

// Create project
export async function createProject(
  name: string,
  userId: string,
  orgId?: string | null,
  description?: string,
  color?: string
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      user_id: orgId ? null : userId, // If org project, user_id is null
      clerk_org_id: orgId || null,
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
  // 1. First, get all flow IDs for this project
  const { data: flows, error: flowsSelectError } = await supabase
    .from("flows")
    .select("id")
    .eq("project_id", id)
    .is("deleted_at", null); // Only get non-deleted flows

  if (flowsSelectError) throw flowsSelectError;

  // 2. Soft delete all screens in flows belonging to this project
  if (flows && flows.length > 0) {
    const flowIds = flows.map((flow) => flow.id);
    const { error: screensError } = await supabase
      .from("screens")
      .update({ deleted_at: new Date().toISOString() })
      .in("flow_id", flowIds)
      .is("deleted_at", null); // Only update non-deleted screens

    if (screensError) throw screensError;
  }

  // 3. Soft delete all flows belonging to this project
  const { error: flowsError } = await supabase
    .from("flows")
    .update({ deleted_at: new Date().toISOString() })
    .eq("project_id", id)
    .is("deleted_at", null); // Only update non-deleted flows

  if (flowsError) throw flowsError;

  // 4. Soft delete the project itself
  const { error: projectError } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null); // Only update non-deleted projects

  if (projectError) throw projectError;
}

// Upload project avatar
export async function uploadProjectAvatar(
  projectId: string,
  file: File
): Promise<string> {
  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${projectId}-${Date.now()}.${fileExt}`;

      // Upload file to project-avatars bucket
      const avatarUrl = await uploadFile("project-avatars", fileName, file);

  // Update project with avatar URL
  const { error } = await supabase
    .from("projects")
    .update({ avatar_url: avatarUrl })
    .eq("id", projectId);

  if (error) throw error;

  return avatarUrl;
}

// Update project avatar URL
export async function updateProjectAvatar(
  projectId: string,
  avatarUrl: string
): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ avatar_url: avatarUrl })
    .eq("id", projectId);

  if (error) throw error;
}
