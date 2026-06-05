"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

/** Fullscreen filters modal for mobile, with slide-up open/close animation. */
export function FiltersModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const [render, setRender] = useState(open);
  const [closing, setClosing] = useState(false);

  // Keep mounted during the closing animation. State is updated inside
  // timeouts so we never unmount synchronously (and the animation can play).
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => {
        setRender(true);
        setClosing(false);
      }, 0);
      return () => clearTimeout(id);
    }
    let unmountId: ReturnType<typeof setTimeout> | undefined;
    const startId = setTimeout(() => {
      setClosing(true);
      unmountId = setTimeout(() => {
        setRender(false);
        setClosing(false);
      }, 250);
    }, 0);
    return () => {
      clearTimeout(startId);
      if (unmountId) clearTimeout(unmountId);
    };
  }, [open]);

  // Lock background scroll while open.
  useEffect(() => {
    if (!render) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [render]);

  if (!render || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[60] flex flex-col bg-surface lg:hidden",
        closing ? "animate-modal-out" : "animate-modal-in",
      )}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="text-base font-semibold text-ink">{t("results.filtersToggle")}</span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-9 w-9 place-items-center rounded-tile text-ink-2 hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

      <div className="border-t border-line p-4">
        <Button variant="dark" onClick={onClose} className="w-full rounded-tile py-3 text-sm">
          {t("results.showResults")}
        </Button>
      </div>
    </div>,
    document.body,
  );
}
