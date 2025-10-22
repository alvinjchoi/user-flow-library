import { Suspense } from "react"
import { PatternsGrid } from "@/components/patterns-grid"
import { SearchAndFilters } from "@/components/search-and-filters"
import { Header } from "@/components/header"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-balance">UI Pattern Library</h1>
          <p className="text-muted-foreground text-lg">
            Discover and explore curated UI/UX design patterns for your next project
          </p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <SearchAndFilters />
          <PatternsGrid />
        </Suspense>
      </main>
    </div>
  )
}
