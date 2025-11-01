"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ArrowLeft, Share2, Copy, Check, X } from "lucide-react";
import { SignedIn, SignedOut, OrganizationSwitcher } from "@clerk/nextjs";
import { UserNav } from "@/components/auth/user-nav";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateProject } from "@/lib/projects";

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
  onProjectUpdate?: (updatedProject: {
    id: string;
    name: string;
    avatar_url?: string | null;
  }) => void;
}

export function Header({ project, stats, onProjectUpdate }: HeaderProps) {
  const pathname = usePathname();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");

  // Show OrganizationSwitcher only on dashboard and project pages
  const showOrgSwitcher =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/projects/");

  const handleGenerateShareLink = async () => {
    if (!project) return;

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/share`);
      const data = await response.json();

      if (response.ok) {
        setShareUrl(data.shareUrl);
        setIsPublic(data.isPublic);
        setShareDialogOpen(true);
      } else {
        alert("Failed to generate share link: " + data.error);
      }
    } catch (error) {
      console.error("Error generating share link:", error);
      alert("Failed to generate share link");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisableSharing = async () => {
    if (!project) return;

    try {
      const response = await fetch(`/api/projects/${project.id}/share`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIsPublic(false);
        setShareDialogOpen(false);
        alert("Sharing disabled successfully");
      } else {
        alert("Failed to disable sharing");
      }
    } catch (error) {
      console.error("Error disabling sharing:", error);
      alert("Failed to disable sharing");
    }
  };

  const handleProjectNameClick = (e: React.MouseEvent) => {
    if (!project) return;
    e.preventDefault();
    e.stopPropagation();
    setIsEditingName(true);
    setEditingName(project.name);
  };

  const handleProjectNameSave = async () => {
    if (!project || !editingName.trim()) {
      setIsEditingName(false);
      return;
    }

    try {
      await updateProject(project.id, { name: editingName.trim() });
      if (onProjectUpdate) {
        onProjectUpdate({ ...project, name: editingName.trim() });
      }
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating project name:", error);
      alert("Failed to update project name");
      setIsEditingName(false);
    }
  };

  const handleProjectNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleProjectNameSave();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  };

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
              {project && isEditingName ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleProjectNameSave}
                  onKeyDown={handleProjectNameKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xl font-bold bg-transparent border-b-2 border-primary outline-none px-1 py-0.5"
                  autoFocus
                />
              ) : (
                <span
                  className={`text-xl font-bold ${
                    project
                      ? "cursor-text hover:underline decoration-2 underline-offset-4"
                      : ""
                  }`}
                  onClick={project ? handleProjectNameClick : undefined}
                >
                  {project ? project.name : "User Flow Library"}
                </span>
              )}
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
            {showOrgSwitcher && (
              <OrganizationSwitcher
                hidePersonal={true}
                afterCreateOrganizationUrl="/dashboard"
                afterSelectOrganizationUrl="/dashboard"
              />
            )}
            {/* Share button for project pages */}
            {project && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateShareLink}
                disabled={isGenerating}
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                {isGenerating ? "Generating..." : "Share"}
              </Button>
            )}
            <Link
              href="/dashboard"
              className="text-sm hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
          </SignedIn>
          <UserNav />
        </nav>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Project</DialogTitle>
            <DialogDescription>
              Anyone with this link can view this project and its flows.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input id="link" value={shareUrl} readOnly className="h-9" />
            </div>
            <Button
              type="button"
              size="sm"
              className="px-3"
              onClick={handleCopyLink}
            >
              <span className="sr-only">Copy</span>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          {isPublic && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Sharing is enabled
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisableSharing}
                className="text-destructive hover:text-destructive gap-2"
              >
                <X className="h-4 w-4" />
                Disable sharing
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
}
