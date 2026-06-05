"use client";

import { Map as MapIcon } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import type { Specialist } from "@/lib/types";

/**
 * Placeholder for the hybrid map (MapLibre + Warsaw district overlay).
 * The real map is implemented in the next step; this keeps the layout working.
 */
export function MapView({
  specialists,
}: {
  specialists: Specialist[];
  activeId?: string | null;
  onSelect?: (id: string | null) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-panel border border-line-3 bg-[#eef1f4]">
      {/* Legend */}
      <div className="absolute left-4 top-4 z-10 rounded-tile border border-line-3 bg-surface/95 p-3 text-[12px] shadow-sm">
        <p className="mb-1.5 text-[11px] font-bold tracking-[0.5px] text-ink-3">
          {t("results.legendTitle")}
        </p>
        <Legend color="#22b33f" label={t("results.fAvailNow")} />
        <Legend color="#e0a400" label={t("results.fAvailWeek")} />
        <Legend color="#f97316" label={t("results.fAvailDate")} />
      </div>

      <div className="grid h-full place-items-center text-center text-ink-3">
        <div>
          <MapIcon className="mx-auto h-8 w-8 text-ink-4" />
          <p className="mt-2 text-sm font-medium text-ink-2">
            Mapa MapLibre + dzielnice — wkrótce
          </p>
          <p className="text-[12px]">{specialists.length} pinów do wyświetlenia</p>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-ink-2">{label}</span>
    </div>
  );
}
