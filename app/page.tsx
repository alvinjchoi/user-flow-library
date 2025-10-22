"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { getProjects, createProject } from "@/lib/projects";
import type { Project } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject() {
    const name = prompt("Project name:");
    if (!name) return;

    try {
      const project = await createProject(name);
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project. Make sure you've run the SQL setup!");
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
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center">
          <h1 className="text-lg font-semibold">User Flow Organizer</h1>
        </div>
      </header>

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
                  If this is your first time, make sure you've run the SQL setup
                  in Supabase:
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
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <CardTitle className="text-lg truncate">
                        {project.name}
                      </CardTitle>
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
    </div>
  );
}
