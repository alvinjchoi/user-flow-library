"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PatternCard } from "@/components/pattern-card";
import { Pagination } from "@/components/pagination";
import { getPatterns } from "@/lib/patterns";
import type { Pattern } from "@/lib/supabase";

const ITEMS_PER_PAGE = 24;

export function PatternsGrid() {
  const searchParams = useSearchParams();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const searchQuery = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "all";
  const tagFiltersString = searchParams.get("tags") || "";
  const tagFilters = tagFiltersString.split(",").filter(Boolean);
  const currentPage = Number.parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    async function fetchPatterns() {
      setLoading(true);
      try {
        const { patterns: data, total: count } = await getPatterns({
          search: searchQuery || undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
          tags: tagFilters.length > 0 ? tagFilters : undefined,
          limit: ITEMS_PER_PAGE,
          offset: (currentPage - 1) * ITEMS_PER_PAGE,
        });
        setPatterns(data);
        setTotal(count);
      } catch (error) {
        console.error("Error fetching patterns:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPatterns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, categoryFilter, tagFiltersString, currentPage]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">Loading patterns...</p>
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No patterns found matching your criteria.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters or search query.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, total)}{" "}
        of {total} patterns
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patterns.map((pattern) => (
          <PatternCard key={pattern.id} pattern={pattern} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}
    </div>
  );
}
