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
    console.log("[API /projects/[id]] Query result:", {
      data: data?.id,
      error: error?.code,
    });

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      console.error("Error fetching project:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/projects/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
