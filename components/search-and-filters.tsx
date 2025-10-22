"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, SlidersHorizontal, X } from "lucide-react"
import patterns from "@/data/patterns.json"

export function SearchAndFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const searchQuery = searchParams.get("search") || ""
  const categoryFilter = searchParams.get("category") || "all"
  const tagFilters = searchParams.get("tags")?.split(",").filter(Boolean) || []

  // Extract unique categories and tags
  const categories = ["all", ...Array.from(new Set(patterns.map((p) => p.category)))]
  const allTags = Array.from(new Set(patterns.flatMap((p) => p.tags))).sort()

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearchChange = (value: string) => {
    updateParams({ search: value || null })
  }

  const handleCategoryChange = (value: string) => {
    updateParams({ category: value === "all" ? null : value })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = tagFilters.includes(tag) ? tagFilters.filter((t) => t !== tag) : [...tagFilters, tag]

    updateParams({ tags: newTags.length > 0 ? newTags.join(",") : null })
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || tagFilters.length > 0

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search patterns..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Tags {tagFilters.length > 0 && `(${tagFilters.length})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Filter by tags</h4>
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                {allTags.map((tag) => (
                  <label key={tag} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={tagFilters.includes(tag)} onCheckedChange={() => handleTagToggle(tag)} />
                    <span className="text-sm">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {tagFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tagFilters.map((tag) => (
            <Button
              key={tag}
              variant="secondary"
              size="sm"
              onClick={() => handleTagToggle(tag)}
              className="h-7 text-xs"
            >
              {tag}
              <X className="w-3 h-3 ml-1" />
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
