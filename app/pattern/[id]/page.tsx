import { notFound } from "next/navigation"
import { PatternDetail } from "@/components/pattern-detail"
import { Header } from "@/components/header"
import patterns from "@/data/patterns.json"

export function generateStaticParams() {
  return patterns.map((pattern) => ({
    id: pattern.id,
  }))
}

export default function PatternPage({ params }: { params: { id: string } }) {
  const pattern = patterns.find((p) => p.id === params.id)

  if (!pattern) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <PatternDetail pattern={pattern} />
      </main>
    </div>
  )
}
