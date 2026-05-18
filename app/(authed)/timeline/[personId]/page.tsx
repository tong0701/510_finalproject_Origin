import { getPersonForCurrentUser } from "@/lib/data/persons";
import { listStoriesForPerson } from "@/lib/data/stories";
import { demoStoryPhotoByOrder } from "@/lib/demo/media";
import { resolveStoryPhotoUrls } from "@/lib/storage/resolve-photo";
import { parseStoryYear, splitAndSortStories } from "@/lib/timeline/sort";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ personId: string }> };

function storyAge(birthYear: number | null, storyYear: number | null) {
  if (birthYear == null || storyYear == null) return null;
  return storyYear - birthYear;
}

export default async function TimelinePage({ params }: Props) {
  const { personId } = await params;
  const person = await getPersonForCurrentUser(personId);
  if (!person) notFound();
  const stories = await listStoriesForPerson(personId);
  const { dated, undated } = splitAndSortStories(stories);
  const personName = person.name;

  async function thumb(path: string | null, orderIndex: number) {
    if (path) {
      const resolved = (await resolveStoryPhotoUrls([path]))[0];
      if (resolved) return resolved;
    }
    return demoStoryPhotoByOrder(personName, orderIndex);
  }

  const datedRows = await Promise.all(
    dated.map(async (s) => ({ s, thumb: await thumb(s.photo_urls?.[0] ?? null, s.order_index) })),
  );
  const undatedRows = await Promise.all(
    undated.map(async (s) => ({ s, thumb: await thumb(s.photo_urls?.[0] ?? null, s.order_index) })),
  );

  const subtitle = [person.relationship, person.birth_year ? `b. ${person.birth_year}` : null]
    .filter(Boolean)
    .join(" · ");

  const Entry = ({
    yearLabel,
    age,
    theme,
    question,
    response,
    thumbUrl,
    storyId,
    hasAudio,
    photoCount,
  }: {
    yearLabel: string;
    age: number | null;
    theme: string | null;
    question: string;
    response: string;
    thumbUrl: string | null;
    storyId: string;
    hasAudio: boolean;
    photoCount: number;
  }) => (
    <article className="relative mb-12 grid grid-cols-[120px_1fr] gap-8">
      <div className="pt-1 text-right">
        <div className="display text-[26px] text-[var(--origins-ember-deep)]">{yearLabel}</div>
        {age != null ? <p className="muted mt-1 text-xs">age {age}</p> : null}
      </div>
      <div className="relative border-l border-[var(--origins-edge)] pl-8">
        <span className="absolute -left-[5px] top-2 h-[9px] w-[9px] rounded-full border-2 border-[var(--origins-paper)] bg-[var(--origins-ember)]" />
        {theme ? <p className="ai-question mb-2">{theme}</p> : null}
        <h2 className="display mb-2 text-[22px] leading-snug text-[var(--origins-ink)]">{question}</h2>
        <p className="font-serif mb-4 max-w-[480px] text-[15px] leading-relaxed text-[var(--origins-ink-soft)]">
          {response || "(Audio or photos)"}
        </p>
        {thumbUrl ? (
          <div className={`photo photo-rotate-1 mb-3 inline-block`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbUrl} alt="" className="photo-inner block h-[88px] w-[120px] object-cover" />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--origins-ink-muted)]">
          {hasAudio ? <span>♪ audio</span> : null}
          {photoCount > 0 ? (
            <span>
              {photoCount} photo{photoCount === 1 ? "" : "s"}
            </span>
          ) : null}
          <Link href={`/story/${storyId}`} className="font-medium text-[var(--origins-ember-deep)] hover:underline">
            Read full story →
          </Link>
        </div>
      </div>
    </article>
  );

  return (
    <div className="mx-auto max-w-[920px] px-8 pb-16 pt-10">
      <header className="mb-10 flex flex-wrap items-end gap-7">
        <div className="photo photo-rotate-1 shrink-0">
          <div className="photo-inner relative h-[170px] w-[140px] overflow-hidden">
            {person.photo_url ? (
              <Image
                src={person.photo_url}
                alt={`${person.name} portrait`}
                fill
                className="object-cover"
                sizes="140px"
                unoptimized
              />
            ) : null}
          </div>
        </div>
        <div className="min-w-0 flex-1 pb-2">
          <p className="ai-question mb-2">Timeline</p>
          <h1 className="display text-[40px] text-[var(--origins-ink)]">{person.name}</h1>
          {subtitle ? (
            <p className="font-serif mt-2 text-[17px] italic text-[var(--origins-ink-soft)]">{subtitle}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/interview/${person.id}`} className="btn-primary !text-[13px]">
              Continue interview
            </Link>
            <Link href="/dashboard" className="btn-secondary !text-[13px]">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {datedRows.length > 0 ? (
        <section>
          {datedRows.map(({ s, thumb }) => {
            const year = parseStoryYear(s.estimated_date);
            return (
              <Entry
                key={s.id}
                yearLabel={year != null ? String(year) : "—"}
                age={storyAge(person.birth_year, year)}
                theme={s.theme}
                question={s.question_text}
                response={s.response_text}
                thumbUrl={thumb}
                storyId={s.id}
                hasAudio={Boolean(s.audio_url)}
                photoCount={s.photo_urls?.length ?? 0}
              />
            );
          })}
        </section>
      ) : null}

      {undatedRows.length > 0 ? (
        <section className="mt-4 border-t border-[var(--origins-edge)] pt-10">
          <p className="ai-question mb-8">Undated · sorted by capture date</p>
          {undatedRows.map(({ s, thumb }) => (
            <Entry
              key={s.id}
              yearLabel="—"
              age={null}
              theme={s.theme}
              question={s.question_text}
              response={s.response_text}
              thumbUrl={thumb}
              storyId={s.id}
              hasAudio={Boolean(s.audio_url)}
              photoCount={s.photo_urls?.length ?? 0}
            />
          ))}
        </section>
      ) : null}

      {datedRows.length === 0 && undatedRows.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--origins-edge)] px-8 py-12 text-center">
          <p className="text-[var(--origins-ink)]">No stories yet.</p>
          <Link href={`/interview/${person.id}`} className="btn-primary mt-4 inline-flex !text-sm">
            Start an interview
          </Link>
        </div>
      ) : null}
    </div>
  );
}
