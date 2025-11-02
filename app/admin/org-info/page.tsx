"use client";

import { useUser, useOrganization } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export default function OrgInfoPage() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [copiedOrg, setCopiedOrg] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);

  const copyToClipboard = async (text: string, type: "org" | "user") => {
    await navigator.clipboard.writeText(text);
    if (type === "org") {
      setCopiedOrg(true);
      setTimeout(() => setCopiedOrg(false), 2000);
    } else {
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Organization & User Info</h1>
          <p className="text-muted-foreground">
            Use these IDs to assign projects to organizations in Supabase
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Organization</CardTitle>
            <CardDescription>
              This is your active Clerk Organization ID
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {organization ? (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Organization Name
                  </label>
                  <p className="text-lg font-semibold">{organization.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Organization ID
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-3 bg-muted rounded-md font-mono text-sm">
                      {organization.id}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(organization.id, "org")}
                    >
                      {copiedOrg ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">
                    📝 To assign existing projects to this organization:
                  </p>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                    <li>Go to Supabase SQL Editor</li>
                    <li>Run: <code className="bg-background px-1 py-0.5 rounded">sql/how-to/ASSIGN_PROJECTS_TO_ORG.sql</code></li>
                    <li>Replace <code className="bg-background px-1 py-0.5 rounded">YOUR_CLERK_ORG_ID</code> with: <code className="bg-background px-1 py-0.5 rounded font-mono">{organization.id}</code></li>
                  </ol>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                No organization selected. Please select or create an organization.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current User</CardTitle>
            <CardDescription>Your Clerk User ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    User Name
                  </label>
                  <p className="text-lg font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    User ID
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-3 bg-muted rounded-md font-mono text-sm">
                      {user.id}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(user.id, "user")}
                    >
                      {copiedUser ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Not signed in</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <CardTitle>SQL Update Command</CardTitle>
            <CardDescription>
              Copy and paste this into Supabase SQL Editor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {organization ? (
              <pre className="p-4 bg-muted rounded-md overflow-x-auto text-sm">
                <code>{`-- Assign all existing projects to: ${organization.name}
UPDATE projects
SET clerk_org_id = '${organization.id}', user_id = NULL
WHERE clerk_org_id IS NULL AND deleted_at IS NULL;

-- Verify the update
SELECT id, name, clerk_org_id, created_at
FROM projects
WHERE clerk_org_id = '${organization.id}';`}</code>
              </pre>
            ) : (
              <p className="text-muted-foreground">
                Select an organization to generate the SQL command
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
