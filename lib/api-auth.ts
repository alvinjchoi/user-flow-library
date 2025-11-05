import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase-admin";

export interface AuthContext {
  userId: string;
  orgId: string | null;
}

/**
 * Validates authentication and returns auth context
 * Returns NextResponse (401) if unauthorized, otherwise returns AuthContext
 */
export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const { userId, orgId } = await auth();

  if (!userId && !orgId) {
    console.log("[API Auth] Unauthorized: No userId or orgId");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { userId: userId!, orgId: orgId || null };
}

/**
 * Applies access control filter to a Supabase query based on auth context
 * Filters by organization if orgId exists, otherwise by userId
 */
export function applyAccessFilter<T>(
  query: T,
  context: AuthContext,
  options: {
    userIdField?: string;
    orgIdField?: string;
  } = {}
): T {
  const { userIdField = "user_id", orgIdField = "clerk_org_id" } = options;

  if (context.orgId) {
    console.log(`[API Auth] Filtering by ${orgIdField}:`, context.orgId);
    return (query as any).eq(orgIdField, context.orgId);
  } else if (context.userId) {
    console.log(`[API Auth] Filtering by ${userIdField}:`, context.userId);
    return (query as any).eq(userIdField, context.userId);
  }

  return query;
}

/**
 * Verifies user has access to a specific project
 * Returns the project if authorized, otherwise returns NextResponse (404)
 */
export async function requireProjectAccess(
  projectId: string,
  context: AuthContext
): Promise<any | NextResponse> {
  let query = supabaseAdmin
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .is("deleted_at", null);

  query = applyAccessFilter(query, context);

  const { data: project, error } = await query.single();

  if (error || !project) {
    console.log("[API Auth] Project not found or access denied:", projectId);
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  return project;
}

/**
 * Verifies user has access to a flow via its project
 * Returns the flow and project if authorized, otherwise returns NextResponse (404)
 */
export async function requireFlowAccess(
  flowId: string,
  context: AuthContext
): Promise<{ flow: any; project: any } | NextResponse> {
  // Get flow with its project
  const { data: flow, error: flowError } = await supabaseAdmin
    .from("flows")
    .select("*, projects!inner(*)")
    .eq("id", flowId)
    .is("deleted_at", null)
    .single();

  if (flowError || !flow) {
    console.log("[API Auth] Flow not found:", flowId);
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }

  // Check project access
  const project = flow.projects as any;
  const hasAccess = context.orgId
    ? project.clerk_org_id === context.orgId
    : project.user_id === context.userId;

  if (!hasAccess) {
    console.log("[API Auth] No access to flow project");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { flow, project };
}

/**
 * Verifies user has access to a screen via its flow's project
 * Returns the screen if authorized, otherwise returns NextResponse (404/403)
 */
export async function requireScreenAccess(
  screenId: string,
  context: AuthContext
): Promise<any | NextResponse> {
  // Get screen with its flow and project
  const { data: screen, error: screenError } = await supabaseAdmin
    .from("screens")
    .select("*, flows!inner(*, projects!inner(*))")
    .eq("id", screenId)
    .is("deleted_at", null)
    .single();

  if (screenError || !screen) {
    console.log("[API Auth] Screen not found:", screenId);
    return NextResponse.json({ error: "Screen not found" }, { status: 404 });
  }

  // Check project access through flow
  const flow = screen.flows as any;
  const project = flow.projects as any;
  const hasAccess = context.orgId
    ? project.clerk_org_id === context.orgId
    : project.user_id === context.userId;

  if (!hasAccess) {
    console.log("[API Auth] No access to screen project");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return screen;
}

