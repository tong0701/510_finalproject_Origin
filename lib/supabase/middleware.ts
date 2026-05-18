import { getSupabaseUrlAndKey } from "@/lib/supabase/env";
import { createServerClient as sbCreateServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = ["/login", "/auth/callback"];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/");
}

function redirectToLogin(request: NextRequest, reason?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  if (reason) url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const creds = getSupabaseUrlAndKey();

  if (!creds) {
    const { pathname } = request.nextUrl;
    if (isApiPath(pathname)) {
      return NextResponse.json(
        { error: "misconfigured", message: "Missing Supabase environment variables." },
        { status: 503 },
      );
    }
    if (pathname === "/" || !isPublicPath(pathname)) {
      return redirectToLogin(request, "config");
    }
    return response;
  }

  const supabase = sbCreateServerClient(creds.url, creds.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL(user ? "/dashboard" : "/login", request.url));
  }

  if (!user && !isPublicPath(pathname)) {
    if (isApiPath(pathname)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
