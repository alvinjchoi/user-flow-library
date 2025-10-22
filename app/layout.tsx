import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UI Pattern Library - Design Inspiration",
  description:
    "Discover and explore curated UI/UX design patterns for your next project",
  generator: "v0.app",
};

// Conditional ClerkProvider to prevent build errors
function ConditionalClerkProvider({ children }: { children: React.ReactNode }) {
  // Check if Clerk environment variables are available
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try {
      const { ClerkProvider } = require("@clerk/nextjs");
      return (
        <ClerkProvider>
          {children}
        </ClerkProvider>
      );
    } catch (error) {
      console.warn("Clerk not available:", error);
    }
  }
  
  // Fallback: render children without Clerk
  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ConditionalClerkProvider>
          {children}
        </ConditionalClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}
