import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Conditional Supabase client creation to prevent build errors
let supabase: any = null;

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  try {
    supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  } catch (error) {
    console.warn("Supabase not available:", error);
  }
}

export { supabase };

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

