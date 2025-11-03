import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import type { ClerkMiddlewareAuth } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
])

export default clerkMiddleware(async (auth: ClerkMiddlewareAuth, request: NextRequest) => {
  if (isProtectedRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
}
