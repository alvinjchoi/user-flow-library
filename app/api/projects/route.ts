import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAuth, applyAccessFilter } from "@/lib/api-auth";
import { handleAPIError } from "@/lib/api-errors";

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

    if (error) throw error;

    console.log("[API /projects] Success:", data?.length || 0, "projects");
    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    return handleAPIError(error, "GET /api/projects");
  }
}
// Force redeploy Sun Nov  2 15:12:27 PST 2025
