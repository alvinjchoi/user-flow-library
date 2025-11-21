# Clerk Billing Setup Guide

This guide explains how to set up and use Clerk Billing for B2B SaaS in your application.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Enable Billing in Clerk Dashboard](#enable-billing-in-clerk-dashboard)
3. [Create Plans and Features](#create-plans-and-features)
4. [Add Pricing Page](#add-pricing-page)
5. [Control Access with Authorization](#control-access-with-authorization)
6. [Examples](#examples)
7. [Best Practices](#best-practices)

## Overview

Clerk Billing for B2B SaaS allows you to:

- Create subscription plans for organizations
- Add features to plans
- Gate functionality based on plans, features, or permissions
- Use the `<PricingTable />` component to display plans
- Use `has()` method and `<Protect />` component for authorization

> **Note:** Billing is currently in Beta. We recommend [pinning your SDK versions](https://clerk.com/docs/pinning) to avoid breaking changes.

## Enable Billing in Clerk Dashboard

1. Navigate to [Billing Settings](https://dashboard.clerk.com/~/billing/settings) in the Clerk Dashboard
2. Follow the setup wizard to enable billing
3. Choose your payment gateway:
   - **Clerk development gateway**: For development/testing (shared test Stripe account)
   - **Stripe account**: For production (requires your own Stripe account)

### Payment Gateway Setup

- **Development**: Use Clerk's development gateway (no Stripe account needed)
- **Production**: Create a separate Stripe account for production
  - A Stripe account created for development cannot be used for production
  - You'll need to create a separate Stripe account for your production environment

**Cost**: Clerk billing costs 0.7% per transaction, plus Stripe's transaction fees (paid directly to Stripe).

## Create Plans and Features

### Create a Plan

1. Navigate to [Plans](https://dashboard.clerk.com/~/billing/plans) in the Clerk Dashboard
2. Select the **Plans for Organizations** tab
3. Click **Add Plan**
4. Configure your plan:
   - Name (e.g., "Premium", "Pro", "Enterprise")
   - Price and billing cycle
   - Features (can be added during or after plan creation)

> **Tip**: The **Publicly available** option controls whether plans appear in Clerk components like `<PricingTable />` and `<OrganizationProfile />`.

### Add Features to a Plan

[Features](https://clerk.com/docs/guides/secure/features) make it easy to give entitlements to your plans.

1. Navigate to [Plans](https://dashboard.clerk.com/~/billing/plans)
2. Select the plan you want to add a feature to
3. In the **Features** section, click **Add Feature**
4. Create or select a feature (e.g., "advanced_analytics", "priority_support")

> **Important**: If your Clerk instance has existing custom permissions, the corresponding features from those permissions will automatically be added to the free plan for organizations. This ensures organization members get the same set of custom permissions when billing is enabled.

## Add Pricing Page

We've created a pricing page at `/app/pricing/page.tsx` that uses Clerk's `<PricingTable />` component.

### Usage

The pricing page is accessible at `/pricing` and displays all publicly available organization plans.

```tsx
import { PricingTable } from "@clerk/nextjs";

export default function PricingPage() {
  return (
    <div>
      <h1>Choose Your Plan</h1>
      <PricingTable />
    </div>
  );
}
```

### Link to Pricing Page

Add a link to your pricing page in your navigation:

```tsx
<Link href="/pricing">Pricing</Link>
```

## Control Access with Authorization

There are two main ways to control access based on billing:

1. **`has()` method**: For server-side and client-side checks
2. **`<Protect />` component**: For React component-level protection

### Using `has()` Method

The `has()` method checks if an organization has been granted a specific type of access control (plan, feature, permission) and returns a boolean.

#### Client-Side Example

```tsx
"use client";
import { useAuth } from "@clerk/nextjs";

export default function PremiumPage() {
  const { has } = useAuth();

  // Check for a plan
  const hasPremiumPlan = has({ plan: "premium" });

  // Check for a feature
  const hasAdvancedAnalytics = has({ feature: "advanced_analytics" });

  // Check for a permission
  const hasManagePermission = has({ permission: "org:premium_access:manage" });

  if (!hasPremiumPlan) {
    return <div>Upgrade to Premium</div>;
  }

  return <div>Premium Content</div>;
}
```

#### Server-Side Example (API Routes)

```tsx
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { has } = await auth();

  const hasPremiumPlan = has({ plan: "premium" });

  if (!hasPremiumPlan) {
    return NextResponse.json(
      { error: "Premium plan required" },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: "Premium content" });
}
```

See `/app/api/premium-content/route.ts` for a complete example.

### Using `<Protect />` Component

The `<Protect />` component protects content by checking if the organization has been granted access control.

```tsx
"use client";
import { Protect } from "@clerk/nextjs";

export default function ProtectedPage() {
  return (
    <div>
      {/* Protect by plan */}
      <Protect plan="premium" fallback={<div>Upgrade to Premium</div>}>
        <div>Premium Content</div>
      </Protect>

      {/* Protect by feature */}
      <Protect
        feature="advanced_analytics"
        fallback={<div>Feature not available</div>}
      >
        <div>Advanced Analytics Content</div>
      </Protect>

      {/* Protect by permission */}
      <Protect
        permission="org:premium_access:manage"
        fallback={<div>Permission required</div>}
      >
        <div>Admin Content</div>
      </Protect>
    </div>
  );
}
```

See `/app/dashboard/protected-example/page.tsx` for complete examples.

## Examples

We've created several example pages demonstrating different billing authorization patterns:

### 1. Pricing Page

- **Location**: `/app/pricing/page.tsx`
- **Purpose**: Displays subscription plans using `<PricingTable />`
- **Access**: Public (anyone can view plans)

### 2. Premium Content Page

- **Location**: `/app/dashboard/premium/page.tsx`
- **Purpose**: Demonstrates plan-based access using `has()` method
- **Access**: Requires "premium" plan

### 3. Feature Example Page

- **Location**: `/app/dashboard/feature-example/page.tsx`
- **Purpose**: Demonstrates feature-based access using `has()` method
- **Access**: Requires "advanced_analytics" feature

### 4. Protected Example Page

- **Location**: `/app/dashboard/protected-example/page.tsx`
- **Purpose**: Demonstrates using `<Protect />` component for various access controls
- **Access**: Multiple examples with different protection levels

### 5. Premium Content API Route

- **Location**: `/app/api/premium-content/route.ts`
- **Purpose**: Demonstrates server-side billing authorization in API routes
- **Access**: Requires "premium" plan or "advanced_analytics" feature

## Best Practices

### 1. Plan and Feature Naming

- Use clear, consistent naming (e.g., "premium", "pro", "enterprise")
- Use snake_case for feature identifiers (e.g., "advanced_analytics")
- Document your plans and features in your codebase

### 2. Permission-Based Authorization

> **Important**: Permission-based authorization checks link with feature-based authorization checks.

If you're checking a custom permission like `org:teams:manage`, where `teams` is the feature:

- The user's organization **must** be subscribed to a plan that includes the `teams` feature
- If the feature is not part of the plan, the authorization check will return `false`, even if the user has the custom permission

### 3. Fallback Messages

Always provide helpful fallback messages that guide users to upgrade:

```tsx
<Protect
  plan="premium"
  fallback={
    <div>
      <p>This feature requires Premium</p>
      <Link href="/pricing">View Plans</Link>
    </div>
  }
>
  {/* Premium content */}
</Protect>
```

### 4. Server-Side Validation

Always validate billing access on the server side, even if you check on the client:

```tsx
// Client-side check (for UX)
const hasAccess = has({ plan: "premium" });

// Server-side check (for security)
// In your API route:
const { has } = await auth();
if (!has({ plan: "premium" })) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
```

### 5. Testing

- Use Clerk's development gateway for testing
- Test with different plans and features
- Verify both client-side and server-side checks
- Test permission-based checks with the correct feature associations

### 6. Error Handling

Handle cases where billing might not be enabled or plans might not exist:

```tsx
try {
  const hasPremium = has({ plan: "premium" });
  // Use hasPremium
} catch (error) {
  // Handle error gracefully
  console.error("Error checking plan:", error);
}
```

## Next Steps

1. **Enable billing** in the Clerk Dashboard
2. **Create your plans** and add features
3. **Update plan/feature identifiers** in the example code to match your Clerk Dashboard
4. **Test the examples** with different organization subscriptions
5. **Implement billing checks** in your own routes and components

## Resources

- [Clerk Billing for B2B Documentation](https://clerk.com/docs/js-backend/guides/billing/for-b2b)
- [Clerk Features Documentation](https://clerk.com/docs/guides/secure/features)
- [Authorization Checks Documentation](https://clerk.com/docs/guides/secure/authorization-checks)
- [PricingTable Component Reference](https://clerk.com/docs/reference/components/billing/pricing-table)
- [Protect Component Reference](https://clerk.com/docs/reference/components/control/protect)

## Troubleshooting

### Plans/Features Not Appearing

- Check that plans/features are marked as "Publicly available" in Clerk Dashboard
- Verify you're checking the correct plan/feature identifier
- Ensure the organization is subscribed to the plan

### Authorization Checks Always Return False

- Verify the organization is subscribed to a plan with the required feature
- Check that custom permissions include the feature in the permission key (`org:<feature>:<permission>`)
- Ensure billing is enabled in your Clerk instance

### PricingTable Not Showing Plans

- Verify plans are marked as "Publicly available"
- Check that you're on the "Plans for Organizations" tab in Clerk Dashboard
- Ensure billing is enabled
