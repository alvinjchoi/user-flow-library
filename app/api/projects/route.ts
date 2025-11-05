import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAuth, applyAccessFilter } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    console.log("[API /projects] Starting request...");
    
    // Validate authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    // Build query with access control
    let query = supabaseAdmin
      .from("projects")
      .select("*")
      .is("deleted_at", null);

    query = applyAccessFilter(query, authResult);

    console.log("[API /projects] Executing query...");
    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

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
// Force redeploy Sun Nov  2 15:12:27 PST 2025
