import Link from "next/link"
import { Search } from "lucide-react"
import { UserNav } from "@/components/auth/user-nav"

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Patterns</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm hover:text-primary transition-colors">
            Browse
          </Link>
          <Link href="/admin/upload" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Admin
          </Link>
          <UserNav />
        </nav>
      </div>
    </header>
  )
}
