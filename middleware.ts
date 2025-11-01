import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/projects(.*)", "/admin(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)", // Webhooks should be public
  "/share(.*)", // Public share links
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    // Don't protect public routes
    if (isPublicRoute(req)) {
      return;
    }
    
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  } catch (error) {
    console.error("Middleware error:", error);
    // If Clerk is not properly configured, redirect to home
    if (req.nextUrl.pathname.startsWith("/projects") || req.nextUrl.pathname.startsWith("/admin")) {
      return Response.redirect(new URL("/", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
