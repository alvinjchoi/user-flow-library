import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET flows by project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { userId, orgId } = await auth();

    console.log("[API /projects/[id]/flows] Request for project:", projectId);
    console.log("[API /projects/[id]/flows] Auth:", { userId, orgId });

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
      console.log("[API /projects/[id]/flows] Project not found or no access");
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
      console.error("[API /projects/[id]/flows] Error:", flowsError);
      return NextResponse.json({ error: flowsError.message }, { status: 500 });
    }

    console.log("[API /projects/[id]/flows] Success:", flows.length, "flows");
    return NextResponse.json(flows || [], { status: 200 });
  } catch (error) {
    console.error("[API /projects/[id]/flows] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
