"use client"

import { useSearchParams } from "next/navigation"
import { PatternCard } from "@/components/pattern-card"
import { Pagination } from "@/components/pagination"
import patterns from "@/data/patterns.json"

const ITEMS_PER_PAGE = 24

export function PatternsGrid() {
  const searchParams = useSearchParams()

  const searchQuery = searchParams.get("search")?.toLowerCase() || ""
  const categoryFilter = searchParams.get("category") || "all"
  const tagFilters = searchParams.get("tags")?.split(",").filter(Boolean) || []
  const currentPage = Number.parseInt(searchParams.get("page") || "1", 10)

  // Filter patterns
  const filteredPatterns = patterns.filter((pattern) => {
    // Search filter
    if (searchQuery) {
      const searchableText = `${pattern.title} ${pattern.description} ${pattern.tags.join(" ")}`.toLowerCase()
      if (!searchableText.includes(searchQuery)) return false
    }

    // Category filter
    if (categoryFilter !== "all" && pattern.category !== categoryFilter) {
      return false
    }

    // Tag filters (AND logic)
    if (tagFilters.length > 0) {
      if (!tagFilters.every((tag) => pattern.tags.includes(tag))) {
        return false
      }
    }

    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredPatterns.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedPatterns = filteredPatterns.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  if (filteredPatterns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No patterns found matching your criteria.</p>
        <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search query.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredPatterns.length)} of{" "}
        {filteredPatterns.length} patterns
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedPatterns.map((pattern) => (
          <PatternCard key={pattern.id} pattern={pattern} />
        ))}
      </div>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} />}
    </div>
  )
}
