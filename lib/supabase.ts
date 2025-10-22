import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export type Pattern = {
  id: string
  title: string
  tags: string[]
  category: string
  screenshots: string[]
  description: string
  createdAt: string
  created_at?: string
  updated_at?: string
}

