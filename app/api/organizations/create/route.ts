import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    // Create organization via Clerk API
    const clerkResponse = await fetch("https://api.clerk.com/v1/organizations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        created_by: userId,
        slug: name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-"),
      }),
    });

    if (!clerkResponse.ok) {
      const errorData = await clerkResponse.json();
      console.error("Failed to create organization:", errorData);
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      );
    }

    const organization = await clerkResponse.json();

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
      },
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

