import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { auth } from "@clerk/nextjs/server";

// Create Supabase client for server-side queries
const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

// Generate a random share token
function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

// GET - Retrieve or generate share token for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const projectId = id;

    // Get the project
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id, share_token, is_public")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // If project already has a share token, return it
    if (project.share_token) {
      const shareUrl = `${request.nextUrl.origin}/share/${project.share_token}`;
      return NextResponse.json({
        shareToken: project.share_token,
        shareUrl,
        isPublic: project.is_public,
      });
    }

    // Generate a new share token
    const newToken = generateShareToken();

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        share_token: newToken,
        is_public: true,
      })
      .eq("id", projectId);

    if (updateError) {
      console.error("Error updating project:", updateError);
      return NextResponse.json(
        { error: "Failed to generate share link" },
        { status: 500 }
      );
    }

    const shareUrl = `${request.nextUrl.origin}/share/${newToken}`;

    return NextResponse.json({
      shareToken: newToken,
      shareUrl,
      isPublic: true,
    });
  } catch (error) {
    console.error("Error generating share link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Disable sharing for a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const projectId = id;

    // Disable sharing by setting is_public to false
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        is_public: false,
      })
      .eq("id", projectId);

    if (updateError) {
      console.error("Error disabling sharing:", updateError);
      return NextResponse.json(
        { error: "Failed to disable sharing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disabling sharing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

