import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId && !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("projects")
      .select("*")
      .is("deleted_at", null);

    if (orgId) {
      // If in an organization context, get org projects
      query = query.eq("clerk_org_id", orgId);
    } else if (userId) {
      // If personal context, get user's personal projects
      query = query.eq("user_id", userId);
    } else {
      return NextResponse.json([], { status: 200 });
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

