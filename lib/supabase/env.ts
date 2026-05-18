import { getInlineSupabaseKey, getInlineSupabaseUrl } from "@/lib/public-config";

/**
 * Shared checks for Supabase env (Edge middleware + Node server).
 * Never pass placeholder URL/key into @supabase/ssr — it throws at runtime.
 *
 * Supabase now uses publishable keys (`sb_publishable_…`). Legacy anon JWT (`eyJ…`)
 * still works — pass either via NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or
 * NEXT_PUBLIC_SUPABASE_ANON_KEY, or paste into lib/public-config.ts.
 */
export function getSupabasePublishableOrAnonKey(): string | null {
  const key = getInlineSupabaseKey();
  return key || null;
}

export function getSupabaseUrlAndKey(): { url: string; key: string } | null {
  const url = getInlineSupabaseUrl();
  const key = getSupabasePublishableOrAnonKey();
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseUrlAndKey() !== null;
}
