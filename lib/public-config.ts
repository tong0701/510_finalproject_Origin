/**
 * Inline config for deploy (Vercel / clone) when env vars are not set yet.
 * Paste values below — they are public (Supabase anon/publishable key only).
 * Env vars still win when present.
 */
const INLINE_SUPABASE_URL = "https://hspllupinnxholdibccn.supabase.co";
const INLINE_SUPABASE_PUBLISHABLE_OR_ANON_KEY =
  "sb_publishable_1TKl411u-wmhN7Y6HREktw_M3jdrsYO";

export function getInlineSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || INLINE_SUPABASE_URL.trim();
}

export function getInlineSupabaseKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    INLINE_SUPABASE_PUBLISHABLE_OR_ANON_KEY.trim()
  );
}
