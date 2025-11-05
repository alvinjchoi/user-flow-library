import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api-auth";
import { validateBoundingBox, ValidationError } from "@/lib/validators";

// GET /api/screens/[id]/hotspots - Get all hotspots for a screen
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Use service role key to bypass RLS (we already have Clerk auth check)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: hotspots, error } = await supabase
      .from("screen_hotspots")
      .select("*")
      .eq("screen_id", id)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching hotspots:", error);
      return NextResponse.json(
        { error: "Failed to fetch hotspots" },
        { status: 500 }
      );
    }

    return NextResponse.json(hotspots);
  } catch (error) {
    console.error("Unexpected error in GET /api/screens/[id]/hotspots:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/screens/[id]/hotspots - Create a new hotspot
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validate authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    console.log('[Hotspot API] Auth check:', { userId: authResult.userId });

    // Use service role key to bypass RLS (we already have Clerk auth check)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { id: screenId } = await context.params;
    const body = await request.json();

    const {
      x_position,
      y_position,
      width,
      height,
      element_type,
      element_label,
      element_description,
      target_screen_id,
      interaction_type = "navigate",
      confidence_score,
      is_ai_generated = false,
      order_index = 0,
    } = body;

    // Validate bounding box
    let boundingBox;
    try {
      boundingBox = validateBoundingBox({
        x: x_position,
        y: y_position,
        width,
        height,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: error.message, field: error.field },
          { status: 400 }
        );
      }
      throw error;
    }

    console.log('[Hotspot API] Creating hotspot:', {
      screenId,
      element_label,
      position: boundingBox
    });

    const { data: hotspot, error } = await supabase
      .from("screen_hotspots")
      .insert({
        screen_id: screenId,
        x_position: boundingBox.x,
        y_position: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
        element_type,
        element_label,
        element_description,
        target_screen_id,
        interaction_type,
        confidence_score,
        is_ai_generated,
        order_index,
      })
      .select()
      .single();

    if (error) {
      console.error("[Hotspot API] Database error:", {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { error: "Failed to create hotspot", details: error.message },
        { status: 500 }
      );
    }

    console.log('[Hotspot API] Hotspot created successfully:', hotspot.id);
    return NextResponse.json(hotspot, { status: 201 });
  } catch (error: any) {
    console.error(
      "Unexpected error in POST /api/screens/[id]/hotspots:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}
