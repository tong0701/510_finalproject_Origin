import { getStoryForCurrentUser } from "@/lib/data/stories";
import { demoStoryPhotoByOrder } from "@/lib/demo/media";
import { resolveStoryPhotoUrls } from "@/lib/storage/resolve-photo";
import { signStoragePaths } from "@/lib/storage/sign-urls";
import { parseStoryYear } from "@/lib/timeline/sort";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ storyId: string }> };

export default async function StoryPage({ params }: Props) {
  const { storyId } = await params;
  const row = await getStoryForCurrentUser(storyId);
  if (!row) notFound();
  const audioSigned = row.audio_url ? (await signStoragePaths("story-audio", [row.audio_url]))[0] : null;
  let photoSigned = row.photo_urls?.length ? await resolveStoryPhotoUrls(row.photo_urls) : [];
  if (!photoSigned.some(Boolean)) {
    const fallback = demoStoryPhotoByOrder(row.person.name, row.order_index);
    if (fallback) photoSigned = [fallback];
  }
  const year = parseStoryYear(row.estimated_date);
  const metaParts = [row.theme, row.estimated_date ?? (year != null ? String(year) : null)].filter(Boolean);

  return (
    <article className="page-narrow">
      <p className="mb-4 text-[13px] text-[var(--origins-ink-soft)]">
        <Link href={`/timeline/${row.person_id}`} className="hover:text-[var(--origins-ember-deep)]">
          ← Back to timeline
        </Link>
      </p>

      {metaParts.length > 0 ? <p className="ai-question mb-3.5">{metaParts.join(" · ")}</p> : null}

      <h1 className="display mb-3.5 text-[clamp(1.75rem,4vw,2.375rem)] leading-tight text-[var(--origins-ink)]">
        {row.question_text}
      </h1>

      <p className="font-serif mb-7 text-base italic text-[var(--origins-ink-soft)]">
        {row.response_text
          ? "Their words, captured for the family archive."
          : "Listen below or browse the photos from this moment."}
      </p>

      {audioSigned ? (
        <section className="card mb-8 flex flex-wrap items-center gap-4 p-4">
          <audio controls className="min-w-0 flex-1" src={audioSigned} preload="metadata" />
          <span className="muted text-xs">Voice recording</span>
        </section>
      ) : null}

      {photoSigned.some(Boolean) ? (
        <section className="mb-9 flex flex-wrap gap-4">
          {photoSigned.map((url, i) =>
            url ? (
              <div key={`${row.photo_urls[i]}-${i}`} className={`photo photo-rotate-${(i % 3) + 1}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="photo-inner block max-h-48 w-auto object-cover" />
              </div>
            ) : null,
          )}
        </section>
      ) : null}

      {row.response_text ? (
        <div className="font-serif mb-8 text-lg leading-[1.75] text-[var(--origins-ink)]">
          {row.response_text.split(/\n\n+/).map((para, i) => (
            <p key={i} className={i > 0 ? "mt-4" : undefined}>
              {para}
            </p>
          ))}
        </div>
      ) : null}

      <hr className="rule mb-5" />

      <footer className="flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--origins-ink-muted)]">
        <div className="flex flex-wrap gap-4">
          <span>Captured {new Date(row.created_at).toLocaleDateString()}</span>
          {row.theme ? <span>Theme: {row.theme}</span> : null}
          {row.estimated_date ? <span className="font-mono">est. {row.estimated_date}</span> : null}
        </div>
        <Link href={`/interview/${row.person_id}`} className="btn-ghost !px-2 !py-1 !text-xs">
          Continue interview
        </Link>
      </footer>
    </article>
  );
}
