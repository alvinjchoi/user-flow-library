"use client";

import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { UserNav } from "@/components/auth/user-nav";
import Image from "next/image";

interface HeaderProps {
  project?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
  stats?: {
    totalScreens: number;
    totalFlows: number;
  };
}

export function Header({ project, stats }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back arrow for project pages */}
          {project && (
            <Link
              href="/"
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors"
              title="Back to projects"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}

          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
              {project?.avatar_url ? (
                <Image
                  src={project.avatar_url}
                  alt={`${project.name} avatar`}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Search className="w-5 h-5 text-primary-foreground" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold">
                {project ? project.name : "User Flow Organizer"}
              </span>
              {stats && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {stats.totalScreens} screen
                    {stats.totalScreens !== 1 ? "s" : ""}
                  </span>
                  <span className="text-muted-foreground/40">•</span>
                  <span>
                    {stats.totalFlows} flow{stats.totalFlows !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </Link>
        </div>
        <nav className="flex items-center gap-6">
          <SignedIn>
            <Link
              href="/"
              className="text-sm hover:text-primary transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/admin/upload"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Admin
            </Link>
          </SignedIn>
          <SignedOut>
            <Link
              href="/"
              className="text-sm hover:text-primary transition-colors"
            >
              Home
            </Link>
          </SignedOut>
          <UserNav />
        </nav>
      </div>
    </header>
  );
}
