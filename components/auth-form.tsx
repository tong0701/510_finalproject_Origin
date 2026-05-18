"use client";

import { createBrowserClient } from "@/lib/supabase/browser";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const MIN_PASSWORD = 8;

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password.length < MIN_PASSWORD) {
      setMessage(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient();

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          setMessage(error.message);
          return;
        }
        setMessage(
          "Check your email to confirm your account, or sign in if confirmations are disabled.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setMessage(error.message);
          return;
        }
        router.replace("/dashboard");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      {(errorParam === "auth" || errorParam === "config" || message) && (
        <p
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="status"
        >
          {errorParam === "config"
            ? "Supabase URL and key are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or ANON_KEY) in .env.local, then restart npm run dev."
            : errorParam === "auth"
              ? "Something went wrong signing you in. Try again."
              : message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          className={mode === "signin" ? "btn btn-secondary flex-1" : "btn btn-ghost flex-1"}
          onClick={() => {
            setMode("signin");
            setMessage(null);
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={mode === "signup" ? "btn btn-secondary flex-1" : "btn btn-ghost flex-1"}
          onClick={() => {
            setMode("signup");
            setMessage(null);
          }}
        >
          Sign up
        </button>
      </div>

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={MIN_PASSWORD}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-input"
        />
        <p className="mt-1 text-xs text-[var(--origins-ink-muted)]">At least {MIN_PASSWORD} characters.</p>
      </div>

      <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
        {loading ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
      </button>

      <p className="text-center text-[13px] text-[var(--origins-ink-soft)]">
        {mode === "signin" ? (
          <>
            New here?{" "}
            <button
              type="button"
              className="font-medium text-[var(--origins-ember-deep)]"
              onClick={() => setMode("signup")}
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              className="font-medium text-[var(--origins-ember-deep)]"
              onClick={() => setMode("signin")}
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </form>
  );
}
