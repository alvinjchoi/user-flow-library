import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAuth, requireFlowAccess } from "@/lib/api-auth";

// GET screens by flow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flowId } = await params;
    console.log("[API /flows/[id]/screens] Request for flow:", flowId);

    // Validate authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    // Verify flow access
    const flowResult = await requireFlowAccess(flowId, authResult);
    if (flowResult instanceof NextResponse) return flowResult;

    // Get screens for the flow
    const { data: screens, error: screensError } = await supabaseAdmin
      .from("screens")
      .select("*")
      .eq("flow_id", flowId)
      .is("deleted_at", null)
      .order("order_index");

    if (screensError) {
      console.error("[API /flows/[id]/screens] Error:", screensError);
      return NextResponse.json(
        { error: screensError.message },
        { status: 500 }
      );
    }

    console.log("[API /flows/[id]/screens] Success:", screens.length, "screens");
    return NextResponse.json(screens || [], { status: 200 });
  } catch (error) {
    console.error("[API /flows/[id]/screens] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

