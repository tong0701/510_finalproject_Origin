"use client";

import { SignOutButton } from "@/components/sign-out-button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Props = { email: string | null; initials: string };

export function AuthedNav({ email, initials }: Props) {
  const pathname = usePathname();
  const [crumb, setCrumb] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams({ pathname }).toString();
    fetch(`/api/nav-context?${qs}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setCrumb((d?.label as string) ?? "");
      })
      .catch(() => {
        if (!cancelled) setCrumb("");
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--origins-edge)] bg-[var(--origins-paper)]">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-8 py-5">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/dashboard" className="display text-[22px] tracking-tight text-[var(--origins-ink)]">
            Origins<span className="text-[var(--origins-ember)]">.</span>
          </Link>
          {crumb ? <p className="truncate text-[13px] text-[var(--origins-ink-muted)]">{crumb}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-48 truncate text-[13px] text-[var(--origins-ink-soft)] sm:inline">
            {email}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--origins-ember-soft)] text-[13px] font-semibold text-[var(--origins-ember-deep)]">
            {initials}
          </div>
          <SignOutButton />
        </div>
        </div>
    </header>
  );
}
