export type DemoStorySeed = {
  question_text: string;
  response_text: string;
  estimated_date: string | null;
  theme: string | null;
  /** Path under public/demo, e.g. stories/alex-childhood.jpg */
  photo?: string;
};

export type DemoPackId = "builtin" | "grandma";

export type DemoPack = {
  id: DemoPackId;
  title: string;
  blurb: string;
  person: { name: string; relationship: string; birth_year: number; portrait?: string };
  stories: DemoStorySeed[];
};

/** Built-in sample: dated timeline + undated section, no OpenAI required. */
export const BUILTIN_DEMO_PACK: DemoPack = {
  id: "builtin",
  title: "Built-in sample · Alex Rivera",
  blurb: "Grandfather with 5 stories — timeline years + undated bucket. Good for a quick product tour.",
  person: {
    name: "Alex Rivera",
    relationship: "Grandfather",
    birth_year: 1938,
    portrait: "alex-portrait.jpg",
  },
  stories: [
    {
      question_text: "What is one early memory from Alex's childhood that still feels vivid?",
      response_text:
        "He said the kitchen always smelled like cinnamon and coffee before sunrise. His mother would hum while fixing tortillas, and he would sit on the step stool pretending to help stir the masa.",
      estimated_date: "circa 1945",
      theme: "childhood",
      photo: "stories/alex-childhood.jpg",
    },
    {
      question_text: "Tell me about a turning point that changed Alex's path.",
      response_text:
        "After high school he took a job at a print shop downtown. The owner noticed he stayed late to fix broken presses and offered him an apprenticeship that led to thirty years as a master printer.",
      estimated_date: "1962",
      theme: "career",
      photo: "stories/alex-career.jpg",
    },
    {
      question_text: "What family tradition mattered most to Alex?",
      response_text:
        "Every Sunday the whole block would gather for a late lunch. Alex grilled outside rain or shine and insisted everyone tell one story before dessert.",
      estimated_date: "1980s",
      theme: "tradition",
      photo: "stories/alex-tradition.jpg",
    },
    {
      question_text: "What value of Alex's do you hope your family keeps?",
      response_text:
        "He always said: show up when it is inconvenient. That is how people know they matter.",
      estimated_date: null,
      theme: "values",
      photo: "stories/alex-values.jpg",
    },
    {
      question_text: "What made Alex laugh the hardest in those years?",
      response_text:
        "His grandson imitating his serious voice during toasts — Alex would try to stay stern and fail every time.",
      estimated_date: null,
      theme: "humor",
      photo: "stories/alex-humor.jpg",
    },
  ],
};

/** Second demo: Grandma Lin — emotional arc, mix of dated / undated. */
export const GRANDMA_DEMO_PACK: DemoPack = {
  id: "grandma",
  title: "Grandma Lin",
  blurb: "Grandmother in Shanghai → Seattle. 4 stories for a warmer Final presentation.",
  person: {
    name: "Grandma Lin",
    relationship: "Grandmother",
    birth_year: 1940,
    portrait: "grandma-portrait.jpg",
  },
  stories: [
    {
      question_text: "What is one early memory from Grandma Lin's childhood that still feels vivid?",
      response_text:
        "She remembers the alley behind their apartment in Shanghai: vendors shouting, steam from dumpling baskets, and her father teaching her to count change before the school bell rang.",
      estimated_date: "circa 1948",
      theme: "childhood",
      photo: "stories/grandma-childhood.jpg",
    },
    {
      question_text: "Who shaped Grandma Lin's values most while growing up?",
      response_text:
        "Her aunt, who ran a small tailor shop. She told Lin that careful hands and honest prices would outlast any trend.",
      estimated_date: "1955",
      theme: "family",
      photo: "stories/grandma-family.jpg",
    },
    {
      question_text: "Tell me about a turning point that changed Grandma Lin's path.",
      response_text:
        "When the family moved to Seattle, she was fifteen and terrified of English class. A neighbor invited her to help in a community garden; learning plant names in two languages gave her confidence to speak up in school.",
      estimated_date: "1955",
      theme: "migration",
      photo: "stories/grandma-migration.jpg",
    },
    {
      question_text: "What family tradition mattered most to Grandma Lin?",
      response_text:
        "Before every Lunar New Year she still hand-folds dumplings with us and refuses to let anyone rush the folding — she says the folds hold the wishes.",
      estimated_date: null,
      theme: "tradition",
      photo: "stories/grandma-tradition.jpg",
    },
  ],
};

export const DEMO_PACKS: Record<DemoPackId, DemoPack> = {
  builtin: BUILTIN_DEMO_PACK,
  grandma: GRANDMA_DEMO_PACK,
};

export function getDemoPack(id: string): DemoPack | null {
  if (id === "builtin" || id === "grandma") return DEMO_PACKS[id];
  return null;
}
