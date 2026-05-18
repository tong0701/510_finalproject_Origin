import { seedDemoPackForUser } from "@/lib/demo/seed-pack";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { pack?: string };
  const pack = body.pack?.trim();
  if (pack !== "builtin" && pack !== "grandma") {
    return NextResponse.json({ error: "pack must be builtin or grandma" }, { status: 400 });
  }

  try {
    const result = await seedDemoPackForUser(supabase, user.id, pack);
    return NextResponse.json({
      person: result.person,
      storyCount: result.storyCount,
      replaced: result.replaced,
      pack,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Demo seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
