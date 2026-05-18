import { createServerClient } from "@/lib/supabase/server";
import type { Person } from "@/lib/types/person";

export async function listPersons(): Promise<{
  persons: Person[];
  fetchError: string | null;
  missingTable: boolean;
}> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("persons")
    .select("id, user_id, name, relationship, birth_year, photo_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    const missingTable =
      error.message.includes("relation") && error.message.includes("does not exist");
    return { persons: [], fetchError: missingTable ? null : error.message, missingTable };
  }

  return { persons: (data ?? []) as Person[], fetchError: null, missingTable: false };
}

export async function getPersonForCurrentUser(personId: string): Promise<Person | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("persons")
    .select("id, user_id, name, relationship, birth_year, photo_url, created_at")
    .eq("id", personId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as Person;
}
