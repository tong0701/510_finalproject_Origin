"use client";

import { createContext, useContext, useMemo, useState } from "react";

type Toast = { id: string; message: string };
type Ctx = { show: (message: string) => void };
const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const value = useMemo<Ctx>(
    () => ({
      show(message) {
        const id = crypto.randomUUID();
        setToasts((t) => [...t, { id, message }]);
        window.setTimeout(() => {
          setToasts((t) => t.filter((x) => x.id !== id));
        }, 4000);
      },
    }),
    [],
  );

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-full border border-[var(--origins-edge)] bg-[var(--origins-paper-deep)] px-4 py-2 text-sm text-[var(--origins-ink)] shadow"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
