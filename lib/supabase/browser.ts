import { createBrowserClient as sbCreateBrowserClient } from "@supabase/ssr";
import { getSupabaseUrlAndKey } from "@/lib/supabase/env";

export function createBrowserClient() {
  const creds = getSupabaseUrlAndKey();
  if (!creds) {
    throw new Error(
      "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) to .env.local",
    );
  }
  return sbCreateBrowserClient(creds.url, creds.key);
}
