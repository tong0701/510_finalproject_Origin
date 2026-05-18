import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    name?: string;
    relationship?: string;
    birth_year?: number | null;
    photo_url?: string | null;
  };

  const name = body.name?.trim() ?? "";
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const { data, error } = await supabase
    .from("persons")
    .insert({
      user_id: user.id,
      name,
      relationship: body.relationship?.trim() ?? "",
      birth_year: body.birth_year ?? null,
      photo_url: body.photo_url ?? null,
    })
    .select("id, user_id, name, relationship, birth_year, photo_url, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ person: data }, { status: 201 });
}
