import { getSupabaseUrlAndKey } from "@/lib/supabase/env";
import { createServerClient as sbCreateServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const creds = getSupabaseUrlAndKey();
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!creds || !code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const cookieStore = await cookies();
  const supabase = sbCreateServerClient(creds.url, creds.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
