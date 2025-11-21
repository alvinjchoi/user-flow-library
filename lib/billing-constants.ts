/**
 * Billing Plan and Feature Identifiers
 *
 * These constants should match the plan names/slugs and feature identifiers
 * configured in your Clerk Dashboard.
 *
 * Note: Clerk's has() method uses plan names/slugs, not plan IDs.
 * The plan ID (cplan_...) is the internal identifier, but for authorization
 * checks, use the plan name/slug as configured in Clerk Dashboard.
 */

// Plan identifiers (use the plan name/slug from Clerk Dashboard, not the plan ID)
export const PLANS = {
  // Plan ID: cplan_35Ux9G4lzWRWWBTmh2rxJwCVi9V
  // Replace 'premium' with the actual plan name/slug from Clerk Dashboard
  PREMIUM: "premium", // TODO: Update with actual plan name/slug from Clerk Dashboard
} as const;

// Feature identifiers (use the feature slug from Clerk Dashboard)
export const FEATURES = {
  ADVANCED_ANALYTICS: "advanced_analytics", // TODO: Update with actual feature slug
} as const;

// Permission identifiers (format: org:<feature>:<permission>)
export const PERMISSIONS = {
  PREMIUM_ACCESS_MANAGE: "org:premium_access:manage", // TODO: Update with actual permission
} as const;
