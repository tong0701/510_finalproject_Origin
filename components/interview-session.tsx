"use client";

import type { Person } from "@/lib/types/person";
import { createBrowserClient } from "@/lib/supabase/browser";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = { person: Person };

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "image";
}

export function InterviewSession({ person }: Props) {
  const [questionText, setQuestionText] = useState("");
  const [questionVisible, setQuestionVisible] = useState(true);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [responseText, setResponseText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "stopped">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [hintNoAi, setHintNoAi] = useState(false);
  const [consecutiveSkips, setConsecutiveSkips] = useState(0);
  const [skipLoading, setSkipLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const loadQuestion = useCallback(
    async (skipPrevious = false) => {
      const previousQuestion = questionText;
      if (skipPrevious) setSkipLoading(true);
      setLoadingQuestion(true);
      setBanner(null);
      if (skipPrevious) {
        setQuestionVisible(false);
        await new Promise((r) => setTimeout(r, 200));
      }
      try {
        const res = await fetch("/api/interview/next-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            personId: person.id,
            skipPrevious,
            previousQuestion,
          }),
        });
        const data = (await res.json()) as {
          question?: string;
          error?: string;
          openAiConfigured?: boolean;
        };
        if (!res.ok) {
          setBanner(data.error ?? "Could not load the next question.");
          setQuestionText("");
          return;
        }
        setQuestionText(data.question ?? "");
        setQuestionVisible(true);
        setHintNoAi(data.openAiConfigured === false);
        setResponseText("");
        setPhotos([]);
        setAudioBlob(null);
        setRecordingState("idle");
        chunksRef.current = [];
      } catch {
        setBanner("Network error loading question.");
        setQuestionText("");
      } finally {
        setLoadingQuestion(false);
        setSkipLoading(false);
      }
    },
    [person.id, questionText],
  );

  useEffect(() => {
    loadQuestion(false);
  }, [loadQuestion]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  async function startRecording() {
    setBanner(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setAudioBlob(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
        setRecordingState("stopped");
      };
      recorder.start(250);
      setRecordingState("recording");
    } catch {
      setBanner("Microphone permission is required.");
    }
  }

  function stopRecording() {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    mediaRecorderRef.current = null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = responseText.trim();
    if (!trimmed && !audioBlob && photos.length === 0) {
      setBanner("Write something, record audio, or add at least one photo.");
      return;
    }
    if (!questionText) return;

    setSubmitting(true);
    setBanner(null);
    try {
      const supabase = createBrowserClient();
      let audioStoragePath: string | null = null;
      if (audioBlob && audioBlob.size > 0) {
        const path = `${person.id}/${crypto.randomUUID()}.webm`;
        const { error } = await supabase.storage.from("story-audio").upload(path, audioBlob, {
          contentType: audioBlob.type || "audio/webm",
        });
        if (error) throw new Error(`Audio upload failed: ${error.message}`);
        audioStoragePath = path;
      }

      const photoStoragePaths: string[] = [];
      for (const file of photos) {
        const path = `${person.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
        const { error } = await supabase.storage.from("story-photos").upload(path, file, {
          contentType: file.type || "application/octet-stream",
        });
        if (error) throw new Error(`Photo upload failed: ${error.message}`);
        photoStoragePaths.push(path);
      }

      const res = await fetch("/api/interview/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          personId: person.id,
          questionText,
          responseText: trimmed,
          audioStoragePath,
          photoStoragePaths,
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Could not save this answer.");
      setConsecutiveSkips(0);
      await loadQuestion(false);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Something went wrong while saving.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col">
      <div className="page-interview flex flex-1 flex-col items-center justify-center py-8">
        {hintNoAi ? (
          <p className="mb-6 w-full rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Add <code className="rounded bg-white/70 px-1">OPENAI_API_KEY</code> to{" "}
            <code className="rounded bg-white/70 px-1">.env.local</code> for richer question generation.
          </p>
        ) : null}
        {banner ? (
          <p className="mb-6 w-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{banner}</p>
        ) : null}

        <p className="ai-question mb-6 text-center">Interviewing {person.name}</p>

        {loadingQuestion ? (
          <div className="mb-12 h-12 w-full max-w-lg animate-pulse rounded bg-[var(--origins-paper-deep)]" />
        ) : (
          <h1
            className={`display mb-3 text-center text-[clamp(1.75rem,4vw,2.25rem)] leading-snug text-[var(--origins-ink)] transition-opacity duration-200 ${questionVisible ? "opacity-100" : "opacity-0"}`}
          >
            {questionText}
          </h1>
        )}

        <p className="font-serif mb-10 text-center text-base italic text-[var(--origins-ink-soft)]">
          Take your time — type, record, or add photos that help tell the story.
        </p>

        <form onSubmit={onSubmit} className="w-full space-y-6">
          <section className="rounded-[10px] border border-[var(--origins-edge)] bg-[var(--origins-paper-deep)] p-7">
            <div className="mb-5 flex flex-wrap items-center gap-4">
              {recordingState === "recording" ? (
                <button type="button" className="btn-danger !text-sm" onClick={stopRecording}>
                  Stop recording
                </button>
              ) : (
                <button type="button" className="btn-secondary !text-sm" onClick={startRecording}>
                  Record audio
                </button>
              )}
              {audioBlob ? (
                <span className="font-mono text-xs text-[var(--origins-ink-muted)]">
                  Clip ready ({Math.round(audioBlob.size / 1024)} KB)
                </span>
              ) : recordingState === "recording" ? (
                <span className="text-sm font-medium text-[var(--origins-rose)]">Recording…</span>
              ) : null}
            </div>

            <hr className="rule mb-4" />

            <p className="soft mb-2 text-xs">Or type your answer:</p>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={4}
              placeholder="There was an old mango tree behind our house…"
              className="field-input field-serif resize-none"
            />

            <div className="mt-5">
              <input
                type="file"
                accept="image/*"
                multiple
                className="text-sm text-[var(--origins-ink-muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--origins-ember-soft)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[var(--origins-ember-deep)]"
                onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
              />
              {photos.length > 0 ? (
                <p className="mt-2 font-mono text-xs text-[var(--origins-ink-muted)]">
                  {photos.length} photo{photos.length === 1 ? "" : "s"} selected
                </p>
              ) : null}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={skipLoading || loadingQuestion}
              className="btn-ghost !px-0 disabled:opacity-50"
              onClick={async () => {
                await loadQuestion(true);
                setConsecutiveSkips((n) => n + 1);
              }}
            >
              {skipLoading ? "Skipping…" : "← Skip this one"}
            </button>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard" className="btn-secondary !text-sm">
                Save & pause
              </Link>
              <button
                type="submit"
                disabled={submitting || loadingQuestion || !questionText}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save & continue →"}
              </button>
            </div>
          </div>

          {consecutiveSkips >= 3 ? (
            <p className="text-center text-sm text-[var(--origins-ink-muted)]">
              Hard to find one that fits? You can pause and come back later from the{" "}
              <Link href="/dashboard" className="text-[var(--origins-ember-deep)] underline">
                dashboard
              </Link>
              .
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
