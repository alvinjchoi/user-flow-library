import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAuth, requireProjectAccess } from "@/lib/api-auth";

// GET flows by project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    console.log("[API /projects/[id]/flows] Request for project:", projectId);

    // Validate authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    // Verify project access
    const projectResult = await requireProjectAccess(projectId, authResult);
    if (projectResult instanceof NextResponse) return projectResult;

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
