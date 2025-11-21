import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PLANS, FEATURES } from "@/lib/billing-constants";

/**
 * Example API route demonstrating server-side billing authorization
 * This route checks if the organization has a premium plan before allowing access
 * Plan ID: cplan_35Ux9G4lzWRWWBTmh2rxJwCVi9V
 */
export async function GET(request: NextRequest) {
  try {
    // Get the auth object which includes the has() method
    const { userId, orgId, has } = await auth();

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if organization has premium plan
    // Note: Use the plan name/slug from Clerk Dashboard, not the plan ID
    const hasPremiumPlan = has({ plan: PLANS.PREMIUM });

    if (!hasPremiumPlan) {
      return NextResponse.json(
        {
          error: "Premium plan required",
          message: "This endpoint requires a Premium plan subscription",
        },
        { status: 403 }
      );
    }

    // Return premium content
    return NextResponse.json({
      message: "Welcome to Premium Content!",
      data: {
        feature1: "Advanced Analytics",
        feature2: "Priority Support",
        feature3: "Unlimited Projects",
      },
    });
  } catch (error) {
    console.error("Error in premium-content route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Example: Check for a specific feature instead of a plan
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, has } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if organization has a specific feature
    const hasAdvancedAnalytics = has({ feature: FEATURES.ADVANCED_ANALYTICS });

    if (!hasAdvancedAnalytics) {
      return NextResponse.json(
        {
          error: "Feature not available",
          message: "This endpoint requires the Advanced Analytics feature",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Process the request with advanced analytics feature
    return NextResponse.json({
      success: true,
      message: "Advanced analytics processing completed",
      data: body,
    });
  } catch (error) {
    console.error("Error in premium-content POST route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
