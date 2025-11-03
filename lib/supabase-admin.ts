import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Admin Supabase client - BYPASSES RLS
 * Use ONLY in API routes where you've already verified auth with Clerk
 * Never use on the client side!
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
