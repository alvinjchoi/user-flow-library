import { supabase } from "./supabase";
import type { Project } from "./database.types";
import { uploadFile } from "./storage";

// Get all projects - now calls API route which handles auth server-side
export async function getProjects(): Promise<Project[]> {
  try {
    console.log("[getProjects] Fetching from /api/projects...");
    const response = await fetch("/api/projects", {
      method: "GET",
      credentials: "include", // Ensure cookies are sent
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("[getProjects] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[getProjects] Error response:", errorText);
      throw new Error(
        `Failed to fetch projects: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();
    console.log("[getProjects] Success:", data.length, "projects");
    return data;
  } catch (error) {
    console.error("[getProjects] Exception:", error);
    return [];
  }
}

// Get single project - now calls API route which handles auth server-side
// Retries once if initial request fails (to handle auth timing issues)
export async function getProject(id: string): Promise<Project | null> {
  try {
    console.log("[getProject] Fetching project:", id);
    const response = await fetch(`/api/projects/${id}`, {
      method: "GET",
      credentials: "include", // Ensure cookies are sent
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("[getProject] Response status:", response.status);

    // If we get 401 (Unauthorized), wait briefly and retry once
    // This handles cases where Clerk auth cookies aren't ready yet
    if (response.status === 401) {
      console.log("[getProject] Got 401, retrying after 1s...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const retryResponse = await fetch(`/api/projects/${id}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("[getProject] Retry response status:", retryResponse.status);

      if (retryResponse.status === 404) {
        console.log("[getProject] 404 after retry - project not found");
        return null;
      }

      if (!retryResponse.ok) {
        const errorText = await retryResponse.text();
        console.error("[getProject] Error after retry:", errorText);
        throw new Error(`Failed to fetch project after retry: ${errorText}`);
      }

      const data = await retryResponse.json();
      console.log("[getProject] Success after retry:", data.name);
      return data;
    }

    if (response.status === 404) {
      console.log("[getProject] 404 - project not found");
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[getProject] Error response:", errorText);
      throw new Error(`Failed to fetch project: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("[getProject] Success:", data.name);
    return data;
  } catch (error) {
    console.error("[getProject] Exception:", error);
    return null;
  }
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
