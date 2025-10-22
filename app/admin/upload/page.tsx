"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createPattern } from "@/lib/patterns"

export default function AdminUploadPage() {
  const [jsonInput, setJsonInput] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const parsed = JSON.parse(jsonInput)

      // Validate required fields
      const requiredFields = ["id", "title", "tags", "category", "screenshots", "description"]
      const missingFields = requiredFields.filter((field) => !(field in parsed))

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`)
      }

      // Validate field types
      if (typeof parsed.id !== "string" || parsed.id.trim() === "") {
        throw new Error("id must be a non-empty string")
      }
      if (typeof parsed.title !== "string" || parsed.title.trim() === "") {
        throw new Error("title must be a non-empty string")
      }
      if (!Array.isArray(parsed.tags)) {
        throw new Error("tags must be an array")
      }
      if (typeof parsed.category !== "string" || parsed.category.trim() === "") {
        throw new Error("category must be a non-empty string")
      }
      if (!Array.isArray(parsed.screenshots)) {
        throw new Error("screenshots must be an array")
      }
      if (typeof parsed.description !== "string" || parsed.description.trim() === "") {
        throw new Error("description must be a non-empty string")
      }

      // Create the pattern in Supabase
      await createPattern({
        id: parsed.id,
        title: parsed.title,
        tags: parsed.tags,
        category: parsed.category,
        screenshots: parsed.screenshots,
        description: parsed.description,
      })

      setMessage({ 
        type: "success", 
        text: "Pattern successfully added to Supabase! View it on the home page." 
      })
      setJsonInput("")
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Invalid JSON format",
      })
    } finally {
      setLoading(false)
    }
  }

  const examplePattern = {
    id: "example-pattern-1",
    title: "Example Pattern",
    tags: ["tag1", "tag2"],
    category: "Category Name",
    screenshots: ["/example-screenshot-1.jpg", "/example-screenshot-2.jpg"],
    description: "Description of the pattern",
    createdAt: new Date().toISOString(),
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Pattern</CardTitle>
            <CardDescription>Paste JSON for a new pattern to save it to Supabase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="json-input" className="block text-sm font-medium mb-2">
                Pattern JSON
              </label>
              <Textarea
                id="json-input"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={JSON.stringify(examplePattern, null, 2)}
                className="font-mono text-sm min-h-[400px]"
              />
            </div>

            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : "Save to Supabase"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setJsonInput(JSON.stringify(examplePattern, null, 2))}
                disabled={loading}
              >
                Load Example
              </Button>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Required Fields:</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  • <code>id</code>: Unique identifier (string)
                </li>
                <li>
                  • <code>title</code>: Pattern title (string)
                </li>
                <li>
                  • <code>tags</code>: Array of tags (string[])
                </li>
                <li>
                  • <code>category</code>: Category name (string)
                </li>
                <li>
                  • <code>screenshots</code>: Array of image URLs (string[])
                </li>
                <li>
                  • <code>description</code>: Pattern description (string)
                </li>
                <li>
                  • <code>createdAt</code>: ISO date string
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
