import { AuthForm } from "@/components/auth-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="grid min-h-full flex-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-[var(--origins-paper-deep)] p-14 lg:flex">
        <div className="display text-[26px] tracking-tight text-[var(--origins-ink)]">
          Origins<span className="text-[var(--origins-ember)]">.</span>
        </div>

        <div className="relative">
          <div className="photo photo-rotate-1 absolute left-8 top-0 -rotate-3">
            <div className="photo-inner h-24 w-[130px]" />
          </div>
          <div className="photo photo-rotate-2 absolute left-32 top-10 rotate-2">
            <div className="photo-inner h-[140px] w-[110px]" />
          </div>
          <div className="h-56" />
          <h1 className="display mb-3.5 max-w-md text-4xl leading-[1.15] text-[var(--origins-ink)]">
            The stories your family hasn&apos;t told yet.
          </h1>
          <p className="max-w-sm font-serif text-[17px] italic text-[var(--origins-ink-soft)]">
            A gentle interviewer for the people you love.
          </p>
        </div>

        <p className="ai-question text-[11px]">est. 2026 · for grandparents, parents, and the unhurried</p>
      </div>

      <div className="flex flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-[320px] space-y-7">
          <div>
            <h2 className="display text-[28px] text-[var(--origins-ink)]">Welcome back</h2>
            <p className="mt-1.5 text-sm text-[var(--origins-ink-muted)]">Sign in to continue capturing.</p>
          </div>
          <Suspense fallback={<div className="text-sm text-[var(--origins-ink-muted)]">Loading…</div>}>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
