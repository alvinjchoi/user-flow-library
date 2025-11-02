import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Database } from "./database.types";

/**
 * Creates a Supabase client with Clerk authentication token
 * Use this on the SERVER SIDE (API routes, server components)
 */
export async function createSupabaseServerClient() {
  const { getToken } = await auth();
  const supabaseToken = await getToken({ template: "supabase" });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseToken}`,
        },
      },
    }
  );

  return supabase;
}

