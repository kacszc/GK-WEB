"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";

type Toast = { id: number; title: string; body?: string; href?: string };

type ToastContextValue = { show: (t: Omit<Toast, "id">) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

/** Lightweight in-app snackbars (bottom-right), auto-dismiss after 5s. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = nextId++;
      setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 5000);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 print:hidden">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => {
              if (t.href) router.push(t.href);
              dismiss(t.id);
            }}
            className={`pointer-events-auto flex items-start gap-3 rounded-panel border border-line-3 bg-surface p-3.5 shadow-lg animate-fade-up ${t.href ? "cursor-pointer hover:bg-muted" : ""}`}
          >
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pill text-brand-violet">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">{t.title}</p>
              {t.body && <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-2">{t.body}</p>}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismiss(t.id);
              }}
              className="shrink-0 text-ink-4 hover:text-ink-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
