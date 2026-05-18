import { generateInterviewQuestion } from "@/lib/ai/interview-engine";
import { getPersonForCurrentUser } from "@/lib/data/persons";
import { recentStoriesForPerson } from "@/lib/data/stories";
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
    skipPrevious?: boolean;
    previousQuestion?: string | null;
  };
  const personId = body.personId?.trim();
  if (!personId) return NextResponse.json({ error: "personId required" }, { status: 400 });

  const person = await getPersonForCurrentUser(personId);
  if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

  const stories = await recentStoriesForPerson(personId, 14);
  const openai = getOpenAI();
  const { question, usedOpenAi } = await generateInterviewQuestion(openai, person, stories, {
    skipPrevious: Boolean(body.skipPrevious),
    previousQuestion: body.previousQuestion ?? null,
  });

  return NextResponse.json({
    question,
    usedOpenAi,
    openAiConfigured: Boolean(openai),
  });
}
