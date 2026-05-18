import { loadPromptFile } from "@/lib/ai/load-prompt";
import type { Person } from "@/lib/types/person";
import type { Story } from "@/lib/types/story";
import type OpenAI from "openai";

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || full.trim() || "they";
}

export function pickFallbackQuestion(person: Person, exchangeCount: number): string {
  const name = firstName(person.name);
  const qs = [
    `What is one early memory from ${name}'s childhood that still feels vivid?`,
    `Who shaped ${name}'s values most while growing up?`,
    `Tell me about a turning point that changed ${name}'s path.`,
    `What family tradition mattered most to ${name}?`,
    `How did ${name} spend ordinary days when life felt steady?`,
    `What place felt most like home to ${name}?`,
    `What made ${name} laugh the hardest in those years?`,
    `What value of ${name}'s do you hope your family keeps?`,
  ];
  return qs[exchangeCount % qs.length];
}

export async function generateInterviewQuestion(
  openai: OpenAI | null,
  person: Person,
  recentStoriesNewestFirst: Story[],
  opts?: { skipPrevious?: boolean; previousQuestion?: string | null },
): Promise<{ question: string; usedOpenAi: boolean }> {
  const exchangeCount = recentStoriesNewestFirst.length;
  if (!openai) return { question: pickFallbackQuestion(person, exchangeCount), usedOpenAi: false };

  const system = await loadPromptFile("interviewer-system.txt");
  const chronological = [...recentStoriesNewestFirst].reverse();
  const historyLines = chronological
    .map((s, i) => `Exchange ${i + 1}\nQ: ${s.question_text}\nA: ${(s.response_text || "").slice(0, 420)}`)
    .join("\n\n");

  const skipInstruction = opts?.skipPrevious
    ? `\nThe user chose to skip the previous question.\nPrevious skipped question: ${opts.previousQuestion ?? "(unknown)"}\nGenerate a different question, ideally on a different theme, and do not repeat prior ones.\n`
    : "";

  const userMsg = `Subject: ${person.name}
Relationship: ${person.relationship || "—"}
Birth year: ${person.birth_year ?? "—"}
Prior exchanges: ${exchangeCount}

History:
${historyLines || "(none yet)"}
${skipInstruction}
Produce the next question only.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
      max_tokens: 220,
      temperature: 0.85,
    });
    const q = completion.choices[0]?.message?.content?.trim();
    if (!q) return { question: pickFallbackQuestion(person, exchangeCount), usedOpenAi: false };
    return { question: q.replace(/^["“]|["”]$/g, "").trim(), usedOpenAi: true };
  } catch {
    return { question: pickFallbackQuestion(person, exchangeCount), usedOpenAi: false };
  }
}

export async function extractStoryMetadata(
  openai: OpenAI | null,
  question: string,
  answer: string,
): Promise<{ estimated_date: string | null; theme: string | null }> {
  if (!openai) return { estimated_date: null, theme: null };
  try {
    const system = await loadPromptFile("extract-story-meta.txt");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Question:\n${question}\n\nAnswer:\n${answer.slice(0, 6000)}` },
      ],
      response_format: { type: "json_object" },
      max_tokens: 120,
      temperature: 0.2,
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return { estimated_date: null, theme: null };
    const parsed = JSON.parse(raw) as { estimated_date?: string | null; theme?: string | null };
    return { estimated_date: parsed.estimated_date ?? null, theme: parsed.theme ?? null };
  } catch {
    return { estimated_date: null, theme: null };
  }
}
