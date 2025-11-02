import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET flows by project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { userId, orgId } = await auth();

    console.log("[API /flows/[projectId]] Request for project:", projectId);
    console.log("[API /flows/[projectId]] Auth:", { userId, orgId });

    if (!userId && !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First verify user has access to the project
    let projectQuery = supabaseAdmin
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .is("deleted_at", null);

    if (orgId) {
      projectQuery = projectQuery.eq("clerk_org_id", orgId);
    } else if (userId) {
      projectQuery = projectQuery.eq("user_id", userId);
    }

    const { data: project, error: projectError } = await projectQuery.single();

    if (projectError || !project) {
      console.log("[API /flows/[projectId]] Project not found or no access");
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get flows for the project
    const { data: flows, error: flowsError } = await supabaseAdmin
      .from("flows")
      .select("*")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("order_index");

    if (flowsError) {
      console.error("[API /flows/[projectId]] Error:", flowsError);
      return NextResponse.json({ error: flowsError.message }, { status: 500 });
    }

    console.log("[API /flows/[projectId]] Success:", flows.length, "flows");
    return NextResponse.json(flows || [], { status: 200 });
  } catch (error) {
    console.error("[API /flows/[projectId]] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

