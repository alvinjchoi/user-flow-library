import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

// GET /api/screens/[id]/hotspots - Get all hotspots for a screen
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      interaction_type = 'navigate',
      confidence_score,
      is_ai_generated = false,
      order_index = 0,
    } = body;

    // Validate required fields
    if (
      x_position === undefined ||
      y_position === undefined ||
      width === undefined ||
      height === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required bounding box fields" },
        { status: 400 }
      );
    }

    // Validate bounding box values
    if (
      x_position < 0 || x_position > 100 ||
      y_position < 0 || y_position > 100 ||
      width < 0 || width > 100 ||
      height < 0 || height > 100
    ) {
      return NextResponse.json(
        { error: "Bounding box values must be between 0 and 100" },
        { status: 400 }
      );
    }

    const { data: hotspot, error } = await supabase
      .from("screen_hotspots")
      .insert({
        screen_id: screenId,
        x_position,
        y_position,
        width,
        height,
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
      console.error("Error creating hotspot:", error);
      return NextResponse.json(
        { error: "Failed to create hotspot" },
        { status: 500 }
      );
    }

    return NextResponse.json(hotspot, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/screens/[id]/hotspots:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

