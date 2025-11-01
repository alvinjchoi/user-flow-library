import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

// PATCH /api/hotspots/[id] - Update a hotspot
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validate bounding box values if provided
    if (body.x_position !== undefined && (body.x_position < 0 || body.x_position > 100)) {
      return NextResponse.json(
        { error: "x_position must be between 0 and 100" },
        { status: 400 }
      );
    }
    if (body.y_position !== undefined && (body.y_position < 0 || body.y_position > 100)) {
      return NextResponse.json(
        { error: "y_position must be between 0 and 100" },
        { status: 400 }
      );
    }
    if (body.width !== undefined && (body.width < 0 || body.width > 100)) {
      return NextResponse.json(
        { error: "width must be between 0 and 100" },
        { status: 400 }
      );
    }
    if (body.height !== undefined && (body.height < 0 || body.height > 100)) {
      return NextResponse.json(
        { error: "height must be between 0 and 100" },
        { status: 400 }
      );
    }

    const { data: hotspot, error } = await supabase
      .from("screen_hotspots")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating hotspot:", error);
      return NextResponse.json(
        { error: "Failed to update hotspot" },
        { status: 500 }
      );
    }

    if (!hotspot) {
      return NextResponse.json({ error: "Hotspot not found" }, { status: 404 });
    }

    return NextResponse.json(hotspot);
  } catch (error) {
    console.error("Unexpected error in PATCH /api/hotspots/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/hotspots/[id] - Delete a hotspot
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const { error } = await supabase
      .from("screen_hotspots")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting hotspot:", error);
      return NextResponse.json(
        { error: "Failed to delete hotspot" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/hotspots/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

