import { extractStoryMetadata } from "@/lib/ai/interview-engine";
import { getPersonForCurrentUser } from "@/lib/data/persons";
import { assertPathsBelongToPerson } from "@/lib/interview/storage-paths";
import { getOpenAI } from "@/lib/openai/server-client";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    personId?: string;
    questionText?: string;
    responseText?: string;
    audioStoragePath?: string | null;
    photoStoragePaths?: string[];
  };

  const personId = body.personId?.trim();
  const questionText = body.questionText?.trim() ?? "";
  const responseText = body.responseText?.trim() ?? "";
  const audioPath = body.audioStoragePath?.trim() || null;
  const photoPaths = Array.isArray(body.photoStoragePaths)
    ? body.photoStoragePaths.filter((p) => typeof p === "string")
    : [];

  if (!personId) return NextResponse.json({ error: "personId required" }, { status: 400 });
  if (!questionText) return NextResponse.json({ error: "questionText required" }, { status: 400 });
  if (!responseText && !audioPath && photoPaths.length === 0) {
    return NextResponse.json({ error: "Provide response text, audio, or photos." }, { status: 400 });
  }

  const person = await getPersonForCurrentUser(personId);
  if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

  const storagePaths = [...photoPaths];
  if (audioPath) storagePaths.push(audioPath);
  if (!assertPathsBelongToPerson(storagePaths, personId)) {
    return NextResponse.json({ error: "Invalid storage paths" }, { status: 400 });
  }

  const openai = getOpenAI();
  const meta = await extractStoryMetadata(openai, questionText, responseText);

  const { data: inserted, error } = await supabase
    .from("stories")
    .insert({
      person_id: personId,
      question_text: questionText,
      response_text: responseText,
      audio_url: audioPath,
      photo_urls: photoPaths,
      estimated_date: meta.estimated_date,
      theme: meta.theme,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    storyId: inserted?.id,
    estimated_date: meta.estimated_date,
    theme: meta.theme,
  });
}
