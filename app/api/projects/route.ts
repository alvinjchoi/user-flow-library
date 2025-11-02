import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    console.log("[API /projects] Starting request...");
    const { userId, orgId } = await auth();
    console.log("[API /projects] Auth:", { userId, orgId });

    if (!userId && !orgId) {
      console.log("[API /projects] Unauthorized: No userId or orgId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client (bypasses RLS) since we already verified auth with Clerk
    let query = supabaseAdmin
      .from("projects")
      .select("*")
      .is("deleted_at", null);

    if (orgId) {
      // If in an organization context, get org projects
      console.log("[API /projects] Filtering by orgId:", orgId);
      query = query.eq("clerk_org_id", orgId);
    } else if (userId) {
      // If personal context, get user's personal projects
      console.log("[API /projects] Filtering by userId:", userId);
      query = query.eq("user_id", userId);
    } else {
      console.log("[API /projects] No filter applied, returning empty");
      return NextResponse.json([], { status: 200 });
    }

    console.log("[API /projects] Executing query...");
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("[API /projects] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[API /projects] Success:", data?.length || 0, "projects");
    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error("[API /projects] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

