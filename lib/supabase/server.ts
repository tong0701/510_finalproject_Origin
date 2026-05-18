import { createServerClient as sbCreateServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseUrlAndKey } from "@/lib/supabase/env";

export async function createServerClient() {
  const creds = getSupabaseUrlAndKey();
  if (!creds) {
    throw new Error(
      "Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local — see .env.example.",
    );
  }

  const cookieStore = await cookies();

  return sbCreateServerClient(creds.url, creds.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — middleware refreshes session cookies.
        }
      },
    },
  });
}
