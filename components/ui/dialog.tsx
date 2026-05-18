"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
};

export function Dialog({ open, title, children, onClose, actions }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[420px] rounded-2xl border border-[var(--origins-ember-soft)] bg-[var(--origins-paper)] p-6 shadow-xl">
        <h3 className="font-display text-xl text-[var(--origins-ink)]">{title}</h3>
        <div className="mt-3 text-sm leading-relaxed text-[var(--origins-ink-soft)]">{children}</div>
        {actions ? <div className="mt-6 flex justify-end gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
