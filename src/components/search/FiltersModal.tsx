"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";
import { useSpecialistSearch } from "@/hooks/useSpecialistSearch";
import type { SpecialistFilters } from "@/services";
import type { UserLocation } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Fullscreen mobile filters drawer. Edits a local DRAFT (so taps don't re-query the page) and
 * commits on "Show N results" — the recommended marketplace pattern. The live count comes from a
 * cheap cached search on the draft; closing with X cancels without applying.
 */
export function FiltersModal({
  open,
  onClose,
  filters,
  userLocation,
  onApply,
  renderSidebar,
}: {
  open: boolean;
  onClose: () => void;
  filters: SpecialistFilters;
  userLocation: UserLocation | null;
  onApply: (filters: SpecialistFilters) => void;
  renderSidebar: (
    draft: SpecialistFilters,
    patch: (p: Partial<SpecialistFilters>) => void,
    clear: () => void,
  ) => React.ReactNode;
}) {
  const { t } = useI18n();
  const [render, setRender] = useState(open);
  const [closing, setClosing] = useState(false);
  const [draft, setDraft] = useState<SpecialistFilters>(filters);

  // Re-seed the draft from the live filters each time the drawer opens. Adjusting state during
  // render by comparing the previous prop value is the documented React pattern (no effect needed).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setDraft(filters);
  }

  // Live result count for the apply button. While closed we query the live filters (same key as
  // the page → served from cache, no extra fetch); while open we preview the draft.
  const previewFilters: SpecialistFilters = {
    ...(open ? draft : filters),
    near: userLocation ? { lng: userLocation.lng, lat: userLocation.lat } : undefined,
  };
  const { data } = useSpecialistSearch(previewFilters);
  const count = data?.total;

  // Keep mounted during the closing animation.
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

  const patch = (p: Partial<SpecialistFilters>) => setDraft((d) => ({ ...d, ...p }));
  const clear = () => setDraft((d) => ({ q: d.q, sort: d.sort }));
  const apply = () => {
    onApply(draft);
    onClose();
  };

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

      <div className="flex-1 overflow-y-auto px-4 py-4">{renderSidebar(draft, patch, clear)}</div>

      <div className="border-t border-line p-4">
        <Button variant="dark" onClick={apply} className="w-full rounded-tile py-3 text-sm">
          {count != null ? t("results.showResultsCount", { count }) : t("results.showResults")}
        </Button>
      </div>
    </div>,
    document.body,
  );
}
