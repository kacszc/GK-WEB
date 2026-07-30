"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Centered modal dialog with backdrop, Escape-to-close and scroll lock. */
const sizes = {
  md: "sm:max-w-[440px]",
  lg: "sm:max-w-[640px]",
  xl: "sm:max-w-[960px]",
} as const;

export function Dialog({
  open,
  onClose,
  title,
  size = "md",
  dismissible = true,
  backdrop = "default",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: keyof typeof sizes;
  /** When false, backdrop clicks and Escape do nothing — the dialog closes only via its own
   * buttons. Use for focus-critical flows where a stray click must not dismiss (e.g. auth gate). */
  dismissible?: boolean;
  /** "blur" heavily blurs and darkens the page behind — content stays visible as a teaser but
   * is unreadable and non-distracting (corridor tests: people clicked the background instead). */
  backdrop?: "default" | "blur";
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismissible && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, dismissible]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div
        className={`absolute inset-0 animate-fade-in ${
          backdrop === "blur" ? "bg-ink/60 backdrop-blur-md" : "bg-ink/40"
        }`}
        onClick={dismissible ? onClose : undefined}
      />
      <div
        className={`relative z-10 max-h-[92dvh] w-full animate-dialog-in overflow-y-auto rounded-t-card border border-line bg-surface p-6 shadow-dropdown sm:rounded-card ${sizes[size]}`}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-tile text-ink-2 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
