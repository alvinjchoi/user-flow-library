import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireProjectAccess } from "@/lib/api-auth";
import { handleAPIError } from "@/lib/api-errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("[API /projects/[id]] Request for project:", id);

    // Validate authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    // Verify project access
    const projectResult = await requireProjectAccess(id, authResult);
    if (projectResult instanceof NextResponse) return projectResult;

    console.log("[API /projects/[id]] Success! Returning project:", projectResult.name);
    return NextResponse.json(projectResult, { status: 200 });
  } catch (error) {
    return handleAPIError(error, "GET /api/projects/[id]");
  }
}
