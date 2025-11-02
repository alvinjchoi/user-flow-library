import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET screens by flow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params;
    const { userId, orgId } = await auth();

    console.log("[API /screens/[flowId]] Request for flow:", flowId);
    console.log("[API /screens/[flowId]] Auth:", { userId, orgId });

    if (!userId && !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First verify user has access to the flow's project
    const { data: flow, error: flowError } = await supabaseAdmin
      .from("flows")
      .select("project_id, projects!inner(id, user_id, clerk_org_id)")
      .eq("id", flowId)
      .is("deleted_at", null)
      .single();

    if (flowError || !flow) {
      console.log("[API /screens/[flowId]] Flow not found");
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    // Check access
    const project = flow.projects as any;
    const hasAccess = orgId
      ? project.clerk_org_id === orgId
      : project.user_id === userId;

    if (!hasAccess) {
      console.log("[API /screens/[flowId]] No access to project");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get screens for the flow
    const { data: screens, error: screensError } = await supabaseAdmin
      .from("screens")
      .select("*")
      .eq("flow_id", flowId)
      .is("deleted_at", null)
      .order("order_index");

    if (screensError) {
      console.error("[API /screens/[flowId]] Error:", screensError);
      return NextResponse.json(
        { error: screensError.message },
        { status: 500 }
      );
    }

    console.log("[API /screens/[flowId]] Success:", screens.length, "screens");
    return NextResponse.json(screens || [], { status: 200 });
  } catch (error) {
    console.error("[API /screens/[flowId]] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

