import { notFound } from "next/navigation"
import { PatternDetail } from "@/components/pattern-detail"
import { Header } from "@/components/header"
import { getPatternById, getPatterns } from "@/lib/patterns"

export async function generateStaticParams() {
  try {
    const { patterns } = await getPatterns({ limit: 100 })
    return patterns.map((pattern) => ({
      id: pattern.id,
    }))
  } catch (error) {
    console.error("Error generating static params:", error)
    return []
  }
}

export default async function PatternPage({ params }: { params: { id: string } }) {
  const pattern = await getPatternById(params.id)

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
