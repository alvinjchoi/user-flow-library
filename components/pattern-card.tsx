import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Pattern } from "@/lib/supabase"

export function PatternCard({ pattern }: { pattern: Pattern }) {
  return (
    <Link href={`/pattern/${pattern.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow h-full">
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          <Image
            src={pattern.screenshots[0] || "/placeholder.svg"}
            alt={pattern.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <CardContent className="pt-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-balance">{pattern.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{pattern.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {pattern.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {pattern.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{pattern.tags.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground pt-0">{pattern.category}</CardFooter>
      </Card>
    </Link>
  )
}
