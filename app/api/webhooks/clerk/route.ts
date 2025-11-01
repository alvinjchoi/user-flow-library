import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Clerk Webhook Handler
 * Automatically creates a default organization when a user signs up
 * 
 * Setup in Clerk Dashboard:
 * 1. Go to Webhooks
 * 2. Add endpoint: https://yourdomain.com/api/webhooks/clerk
 * 3. Subscribe to: user.created
 * 4. Copy signing secret to CLERK_WEBHOOK_SECRET env var
 */

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Get the webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, first_name, last_name, email_addresses } = evt.data;

    try {
      // Create organization name
      const orgName = first_name 
        ? `${first_name}'s Organization`
        : email_addresses[0]?.email_address.split("@")[0] + "'s Organization" || "My Organization";

      // Create organization via Clerk API
      const clerkResponse = await fetch("https://api.clerk.com/v1/organizations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: orgName,
          created_by: id,
          // Optionally set slug
          slug: orgName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"),
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

      console.log(`✅ Created organization "${orgName}" for user ${id}`);

      return NextResponse.json({
        success: true,
        message: `Organization created: ${orgName}`,
        organizationId: organization.id,
      });
    } catch (error) {
      console.error("Error in webhook handler:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

