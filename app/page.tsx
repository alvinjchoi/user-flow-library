"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Layers, Users, Share2 } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  // Set page title
  useEffect(() => {
    document.title = "User Flow Library | Home";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Organize Your User Flows
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              A beautiful, collaborative tool for organizing user flows and managing UI screenshots. 
              Perfect for designers, product managers, and development teams.
            </p>

        <SignedOut>
              <div className="flex gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/sign-up">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/sign-in">
                    Sign In
                  </Link>
                </Button>
          </div>
        </SignedOut>

        <SignedIn>
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                </Button>
            </SignedIn>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to organize user flows
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Layers className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Hierarchical Organization
                  </h3>
                  <p className="text-muted-foreground">
                    Organize screens into flows with parent-child relationships. 
                    Perfect for complex user journeys.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-primary" />
              </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Team Collaboration
                  </h3>
                  <p className="text-muted-foreground">
                    Work together with your team using organizations. 
                    Comment on designs and track feedback.
                  </p>
            </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Share2 className="w-6 h-6 text-primary" />
                        </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Share with Clients
                  </h3>
                  <p className="text-muted-foreground">
                    Generate public share links for your projects. 
                    Perfect for client presentations and feedback.
                  </p>
                      </div>
                    </CardContent>
                  </Card>
          </div>
              </div>

        {/* CTA Section */}
        <SignedOut>
          <div className="py-20 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">
                Ready to get started?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Create your free account and start organizing user flows today.
              </p>
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </SignedOut>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} User Flow Library. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
