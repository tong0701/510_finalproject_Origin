import { createServerClient } from "@/lib/supabase/server";
import type { Story } from "@/lib/types/story";

export async function listStoriesForPerson(personId: string): Promise<Story[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("stories")
    .select(
      "id, person_id, question_text, response_text, audio_url, photo_urls, estimated_date, theme, order_index, created_at",
    )
    .eq("person_id", personId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as Story[];
}

export async function recentStoriesForPerson(personId: string, limit = 12): Promise<Story[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("stories")
    .select(
      "id, person_id, question_text, response_text, audio_url, photo_urls, estimated_date, theme, order_index, created_at",
    )
    .eq("person_id", personId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as Story[];
}

export type StoryWithPerson = Story & { person: { id: string; name: string } };

export async function getStoryForCurrentUser(storyId: string): Promise<StoryWithPerson | null> {
  const supabase = await createServerClient();
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select(
      "id, person_id, question_text, response_text, audio_url, photo_urls, estimated_date, theme, order_index, created_at",
    )
    .eq("id", storyId)
    .maybeSingle();
  if (storyError || !story) return null;

  const { data: person } = await supabase
    .from("persons")
    .select("id, name")
    .eq("id", story.person_id)
    .maybeSingle();
  if (!person) return null;

  return { ...(story as Story), person };
}
