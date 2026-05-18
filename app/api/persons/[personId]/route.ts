import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function parseStoragePathFromPublicUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = "/storage/v1/object/public/photos/";
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ personId: string }> },
) {
  const { personId } = await params;
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
    .update({
      name,
      relationship: body.relationship?.trim() ?? "",
      birth_year: body.birth_year ?? null,
      photo_url: body.photo_url ?? null,
    })
    .eq("id", personId)
    .eq("user_id", user.id)
    .select("id, user_id, name, relationship, birth_year, photo_url, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ person: data });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ personId: string }> },
) {
  const { personId } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: person } = await supabase
    .from("persons")
    .select("id, name")
    .eq("id", personId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

  const { count, error } = await supabase
    .from("stories")
    .select("id", { count: "exact", head: true })
    .eq("person_id", personId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ storyCount: count ?? 0, name: person.name });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ personId: string }> },
) {
  const { personId } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: person, error: personErr } = await supabase
    .from("persons")
    .select("id, user_id, name, photo_url")
    .eq("id", personId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (personErr || !person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

  const { data: stories } = await supabase
    .from("stories")
    .select("id, audio_url, photo_urls")
    .eq("person_id", personId);

  const storyCount = stories?.length ?? 0;
  const audioPaths = (stories ?? [])
    .map((s) => s.audio_url)
    .filter((x): x is string => Boolean(x));
  const photoPaths = (stories ?? []).flatMap((s) => s.photo_urls ?? []);
  const profilePath = parseStoragePathFromPublicUrl(person.photo_url);

  if (audioPaths.length) await supabase.storage.from("story-audio").remove(audioPaths);
  if (photoPaths.length) await supabase.storage.from("story-photos").remove(photoPaths);
  if (profilePath) await supabase.storage.from("photos").remove([profilePath]);

  await supabase.from("stories").delete().eq("person_id", personId);
  const { error: delPersonErr } = await supabase.from("persons").delete().eq("id", personId);
  if (delPersonErr) return NextResponse.json({ error: delPersonErr.message }, { status: 500 });

  return NextResponse.json({ deletedStories: storyCount, personName: person.name });
}
