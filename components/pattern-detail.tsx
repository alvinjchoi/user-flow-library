"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import patterns from "@/data/patterns.json"

interface Pattern {
  id: string
  title: string
  tags: string[]
  category: string
  screenshots: string[]
  description: string
  createdAt: string
}

export function PatternDetail({ pattern }: { pattern: Pattern }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % pattern.screenshots.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? pattern.screenshots.length - 1 : prev - 1))
  }

  // Find related patterns by shared tags
  const relatedPatterns = patterns
    .filter((p) => p.id !== pattern.id)
    .map((p) => ({
      pattern: p,
      sharedTags: p.tags.filter((tag) => pattern.tags.includes(tag)).length,
    }))
    .filter((item) => item.sharedTags > 0)
    .sort((a, b) => b.sharedTags - a.sharedTags)
    .slice(0, 3)
    .map((item) => item.pattern)

  const formattedDate = new Date(pattern.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to patterns
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image carousel */}
          <div className="relative aspect-[16/10] bg-muted rounded-lg overflow-hidden group">
            <Image
              src={pattern.screenshots[currentImageIndex] || "/placeholder.svg"}
              alt={`${pattern.title} - Screenshot ${currentImageIndex + 1}`}
              fill
              className="object-contain"
              priority
            />

            {pattern.screenshots.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {pattern.screenshots.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex ? "bg-primary w-6" : "bg-primary/30 hover:bg-primary/50"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {pattern.screenshots.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {pattern.screenshots.map((screenshot, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative flex-shrink-0 w-24 h-16 rounded-md overflow-hidden border-2 transition-all ${
                    index === currentImageIndex
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground/30"
                  }`}
                >
                  <Image
                    src={screenshot || "/placeholder.svg"}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold mb-4 text-balance">{pattern.title}</h1>
            <p className="text-muted-foreground leading-relaxed">{pattern.description}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Category</h3>
                <Badge variant="outline">{pattern.category}</Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {pattern.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Added</h3>
                <p className="text-sm text-muted-foreground">{formattedDate}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Screenshots</h3>
                <p className="text-sm text-muted-foreground">
                  {pattern.screenshots.length} {pattern.screenshots.length === 1 ? "image" : "images"}
                </p>
              </div>
            </CardContent>
          </Card>

          {relatedPatterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedPatterns.map((related) => (
                  <Link key={related.id} href={`/pattern/${related.id}`} className="block group">
                    <div className="flex gap-3">
                      <div className="relative w-20 h-14 flex-shrink-0 rounded overflow-hidden bg-muted">
                        <Image
                          src={related.screenshots[0] || "/placeholder.svg"}
                          alt={related.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          {related.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{related.category}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
