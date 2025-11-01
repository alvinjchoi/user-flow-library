"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useUser, useOrganization } from "@clerk/nextjs";
import {
  getProjects,
  createProject,
  deleteProject,
  uploadProjectAvatar,
  updateProject,
} from "@/lib/projects";
import type { Project } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function HomePage() {
  const router = useRouter();
  const { user } = useUser();
  const { organization } = useOrganization();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set page title
  useEffect(() => {
    document.title = "User Flow Library | Dashboard";
  }, []);

  useEffect(() => {
    loadProjects();
  }, [user, organization]); // Reload when user or organization changes

  async function loadProjects() {
    if (!user && !organization) {
      setProjects([]);
      setLoading(false);
      return;
    }
    try {
      console.log("Loading projects for:", { 
        userId: user?.id, 
        orgId: organization?.id,
        orgName: organization?.name 
      });
      const data = await getProjects();
      console.log("Loaded projects:", data.length, data);
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject() {
    if (!user) {
      alert("You must be signed in to create a project");
      return;
    }

    const name = prompt("Project name:");
    if (!name) return;

    try {
      // Create project with organization ID if in an org context
      const orgId = organization?.id || null;
      const project = await createProject(name, user.id, orgId);
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project. Make sure you've run the SQL setup!");
    }
  }

  async function handleDeleteProject() {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete.id);
      setProjects(projects.filter((p) => p.id !== projectToDelete.id));
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
    }
  }

  function openDeleteDialog(project: Project, event: React.MouseEvent) {
    event.stopPropagation(); // Prevent card click
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  }

  function handleProjectNameClick(project: Project, event: React.MouseEvent) {
    event.stopPropagation(); // Prevent card click
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  }

  async function handleProjectNameSave(projectId: string) {
    if (!editingProjectName.trim()) {
      setEditingProjectId(null);
      return;
    }

    try {
      await updateProject(projectId, { name: editingProjectName.trim() });
      setProjects(projects.map(p => 
        p.id === projectId ? { ...p, name: editingProjectName.trim() } : p
      ));
      setEditingProjectId(null);
    } catch (error) {
      console.error("Error updating project name:", error);
      alert("Failed to update project name");
      setEditingProjectId(null);
    }
  }

  function handleProjectNameKeyDown(projectId: string, e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleProjectNameSave(projectId);
    } else if (e.key === "Escape") {
      setEditingProjectId(null);
    }
  }

  const [uploadingProjectId, setUploadingProjectId] = useState<string | null>(
    null
  );

  async function handleAvatarUpload(project: Project, event: React.MouseEvent) {
    event.stopPropagation(); // Prevent card click
    setUploadingProjectId(project.id);
    fileInputRef.current?.click();
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !uploadingProjectId) return;

    try {
      await uploadProjectAvatar(uploadingProjectId, file);
      // Reload projects to show updated avatar
      await loadProjects();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploadingProjectId(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
                <p className="text-muted-foreground mb-6">
                  Create your first project to start organizing user flows and
                  uploading screenshots.
                </p>
                <Button onClick={handleCreateProject} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Project
                </Button>

                <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-sm">
                  <p className="font-semibold mb-2">⚠️ Setup Required</p>
                  <p className="text-left text-muted-foreground">
                    If this is your first time, make sure you've run the SQL
                    setup in Supabase:
                    <br />
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                      sql/CREATE_FLOW_TABLES.sql
                    </code>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Projects</h2>
                <Button onClick={handleCreateProject} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow group relative"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    {/* Delete button - appears on hover */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={(e) => openDeleteDialog(project, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        {/* Avatar with hover pencil icon */}
                        <div className="relative group">
                          {project.avatar_url ? (
                            <img
                              src={project.avatar_url}
                              alt={`${project.name} avatar`}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: project.color }}
                            />
                          )}
                          {/* Pencil icon - appears on hover */}
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute -top-1 -right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            onClick={(e) => handleAvatarUpload(project, e)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {editingProjectId === project.id ? (
                          <input
                            type="text"
                            value={editingProjectName}
                            onChange={(e) => setEditingProjectName(e.target.value)}
                            onBlur={() => handleProjectNameSave(project.id)}
                            onKeyDown={(e) => handleProjectNameKeyDown(project.id, e)}
                            className="text-lg font-semibold bg-transparent border-b-2 border-primary outline-none px-1 py-0.5 w-full"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <CardTitle 
                            className="text-lg truncate cursor-text hover:underline decoration-2 underline-offset-4"
                            onClick={(e) => handleProjectNameClick(project, e)}
                          >
                          {project.name}
                        </CardTitle>
                        )}
                      </div>
                      {project.description && (
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Created{" "}
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This
              will permanently delete the project and all associated flows and
              screens. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
