import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, orgId } = await auth();

    // Debug logging
    console.log("[API /projects/[id]] Request for project:", id);
    console.log("[API /projects/[id]] Auth context:", { userId, orgId });

    if (!userId && !orgId) {
      console.log("[API /projects/[id]] Unauthorized: No userId or orgId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client (bypasses RLS) since we already verified auth with Clerk
    let query = supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null);

    // Ensure user can only access their own projects or projects from their organization
    if (orgId) {
      console.log("[API /projects/[id]] Filtering by orgId:", orgId);
      query = query.eq("clerk_org_id", orgId);
    } else if (userId) {
      console.log("[API /projects/[id]] Filtering by userId:", userId);
      query = query.eq("user_id", userId);
    } else {
      console.log("[API /projects/[id]] Unauthorized: No filter applied");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await query.single();
    
    // Detailed logging
    console.log("[API /projects/[id]] Query result:", {
      hasData: !!data,
      dataId: data?.id,
      dataName: data?.name,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint,
    });

    if (error) {
      if (error.code === "PGRST116") {
        console.log("[API /projects/[id]] PGRST116: No rows returned - project not found or access denied");
        return NextResponse.json({ 
          error: "Not found",
          debug: {
            projectId: id,
            orgId,
            userId,
            errorCode: error.code,
          }
        }, { status: 404 });
      }
      console.error("[API /projects/[id]] Supabase error:", JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[API /projects/[id]] Success! Returning project:", data.name);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/projects/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
