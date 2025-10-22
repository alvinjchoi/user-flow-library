"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showEllipsis = totalPages > 7

    if (!showEllipsis) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // Always show first page
    pages.push(1)

    if (currentPage > 3) {
      pages.push("...")
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push("...")
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {getPageNumbers().map((page, index) =>
        typeof page === "number" ? (
          <Button
            key={index}
            variant={currentPage === page ? "default" : "outline"}
            onClick={() => goToPage(page)}
            className="w-10"
          >
            {page}
          </Button>
        ) : (
          <span key={index} className="px-2 text-muted-foreground">
            {page}
          </span>
        ),
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
