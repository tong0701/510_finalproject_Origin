import { getDemoPack, type DemoPackId } from "@/lib/demo/packs";
import type { Person } from "@/lib/types/person";
import type { SupabaseClient } from "@supabase/supabase-js";

import { demoPortraitUrl, demoStoryPhotoRef } from "@/lib/demo/media";

function portraitPublicUrl(personName: string, portrait?: string): string | null {
  if (!portrait) return null;
  return demoPortraitUrl(personName) ?? `/demo/${portrait}`;
}

function isDemoMediaRef(ref: string): boolean {
  return ref.startsWith("demo:") || ref.startsWith("/demo/");
}

function isDemoMediaList(refs: string[] | null | undefined): boolean {
  if (!refs?.length) return true;
  return refs.every(isDemoMediaRef);
}

export async function seedDemoPackForUser(
  supabase: SupabaseClient,
  userId: string,
  packId: DemoPackId,
): Promise<{ person: Person; storyCount: number; replaced: boolean }> {
  const pack = getDemoPack(packId);
  if (!pack) throw new Error("Unknown demo pack");

  const { data: existing } = await supabase
    .from("persons")
    .select("id")
    .eq("user_id", userId)
    .eq("name", pack.person.name);

  let replaced = false;
  if (existing?.length) {
    replaced = true;
    for (const row of existing) {
      await supabase.from("stories").delete().eq("person_id", row.id);
      await supabase.from("persons").delete().eq("id", row.id);
    }
  }

  const { data: person, error: personErr } = await supabase
    .from("persons")
    .insert({
      user_id: userId,
      name: pack.person.name,
      relationship: pack.person.relationship,
      birth_year: pack.person.birth_year,
      photo_url: portraitPublicUrl(pack.person.name, pack.person.portrait),
    })
    .select("id, user_id, name, relationship, birth_year, photo_url, created_at")
    .single();

  if (personErr || !person) throw new Error(personErr?.message ?? "Could not create demo person");

  const storyRows = pack.stories.map((s, i) => ({
    person_id: person.id,
    question_text: s.question_text,
    response_text: s.response_text,
    audio_url: null,
    photo_urls: s.photo ? [demoStoryPhotoRef(s.photo)] : [],
    estimated_date: s.estimated_date,
    theme: s.theme,
    order_index: i,
  }));

  const { error: storiesErr } = await supabase.from("stories").insert(storyRows);
  if (storiesErr) {
    await supabase.from("persons").delete().eq("id", person.id);
    throw new Error(storiesErr.message);
  }

  return { person: person as Person, storyCount: pack.stories.length, replaced };
}

const STARTER_PACK: DemoPackId = "builtin";

/** Seed the default sample profile when a user has no people yet (no UI). */
export async function ensureStarterDemoIfEmpty(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("persons")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  if (count && count > 0) return false;

  await seedDemoPackForUser(supabase, userId, STARTER_PACK);
  return true;
}

/** Force-correct demo photos on every story (by order_index). */
export async function syncDemoPackMedia(
  supabase: SupabaseClient,
  userId: string,
  packId: DemoPackId,
): Promise<void> {
  const pack = getDemoPack(packId);
  if (!pack) return;

  const { data: person } = await supabase
    .from("persons")
    .select("id, photo_url")
    .eq("user_id", userId)
    .eq("name", pack.person.name)
    .maybeSingle();

  if (!person) return;

  const portrait = portraitPublicUrl(pack.person.name, pack.person.portrait);
  if (portrait && (!person.photo_url || isDemoMediaRef(person.photo_url))) {
    await supabase.from("persons").update({ photo_url: portrait }).eq("id", person.id);
  }

  const { data: stories } = await supabase
    .from("stories")
    .select("id, order_index, photo_urls")
    .eq("person_id", person.id)
    .order("order_index", { ascending: true });

  if (!stories?.length) return;

  for (const row of stories) {
    const seed = pack.stories[row.order_index];
    if (!seed?.photo) continue;
    const expected = [demoStoryPhotoRef(seed.photo)];
    const current = row.photo_urls ?? [];
    const needsUpdate =
      !isDemoMediaList(current) ||
      current.length !== 1 ||
      current[0] !== expected[0];
    if (!needsUpdate) continue;
    await supabase.from("stories").update({ photo_urls: expected }).eq("id", row.id);
  }
}

export async function syncStarterDemoMedia(supabase: SupabaseClient, userId: string): Promise<void> {
  await syncDemoPackMedia(supabase, userId, STARTER_PACK);
}
