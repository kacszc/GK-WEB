"use client";

import { MapPin } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { FilterTrigger } from "@/components/ui/FilterTrigger";
import { useI18n } from "@/i18n/I18nProvider";
import type { WhereValue } from "@/lib/types";

export function WhereFilter({
  value,
  onChange,
  align = "end",
  fullWidth = false,
}: {
  value: WhereValue;
  onChange: (v: WhereValue) => void;
  align?: "start" | "end";
  fullWidth?: boolean;
}) {
  const { t } = useI18n();

  return (
    <Popover
      align={align}
      triggerClassName={fullWidth ? "w-full" : undefined}
      trigger={({ open }) => (
        <FilterTrigger
          icon={<MapPin className="h-4 w-4 text-ink-3" />}
          label={t("filters.where")}
          value={t("filters.upTo", { km: value.distanceKm })}
          open={open}
          fullWidth={fullWidth}
        />
      )}
    >
      {() => (
        <div className="w-[min(300px,calc(100vw-3rem))] space-y-4">
          <div>
            <label
              htmlFor="where-location"
              className="text-[11px] font-semibold tracking-[0.5px] text-ink-3"
            >
              {t("filters.location")}
            </label>
            <input
              id="where-location"
              type="text"
              value={value.location}
              onChange={(e) => onChange({ ...value, location: e.target.value })}
              placeholder={t("filters.locationPlaceholder")}
              className="mt-1.5 w-full rounded-tile border border-line-2 bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-ink placeholder:text-ink-4"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.5px] text-ink-3">
              <span>{t("filters.radius")}</span>
              <span className="text-ink">{t("filters.upTo", { km: value.distanceKm })}</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={value.distanceKm}
              onChange={(e) => onChange({ ...value, distanceKm: Number(e.target.value) })}
              aria-label={t("filters.radius")}
              className="mt-2 w-full cursor-pointer accent-brand-violet"
            />
            <div className="flex justify-between text-[10px] text-ink-4">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </div>
        </div>
      )}
    </Popover>
  );
}
