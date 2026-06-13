"use client";

import { useState } from "react";
import { MapPin, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Popover } from "@/components/ui/Popover";
import { FilterTrigger } from "@/components/ui/FilterTrigger";
import { useI18n } from "@/i18n/I18nProvider";
import { geoService } from "@/services";
import type { WhereValue } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Landing "where" filter — same look as before (trigger pill + panel + radius slider), but the city
 * is chosen from the SAME backend city list as the /search & /jobs filters. No city = "Proponowane"
 * (no anchor, no range). Picking a city reveals the radius (default 25 km).
 */
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
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");

  const { data: cities = [] } = useQuery({
    queryKey: ["geoCities", locale],
    queryFn: () => geoService.getCities(locale),
  });
  const filtered = cities.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  const triggerValue = value.city
    ? `${value.city.city ?? value.city.label} · ${t("filters.upTo", { km: value.distanceKm })}`
    : t("filters.anyWhere");

  return (
    <Popover
      align={align}
      triggerClassName={fullWidth ? "w-full" : undefined}
      trigger={({ open }) => (
        <FilterTrigger
          icon={<MapPin className="h-4 w-4 text-ink-3" />}
          label={t("filters.where")}
          value={triggerValue}
          open={open}
          fullWidth={fullWidth}
          placeholder={!value.city}
        />
      )}
    >
      {() => (
        <div className="w-[min(300px,calc(100vw-3rem))] space-y-4">
          <div>
            <label className="text-[11px] font-semibold tracking-[0.5px] text-ink-3">
              {t("filters.location")}
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("results.searchCity")}
              className="mt-1.5 w-full rounded-tile border border-line-2 bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-ink placeholder:text-ink-4"
            />
            <ul className="mt-2 max-h-[200px] overflow-y-auto">
              <li>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, city: null })}
                  className={cn(
                    "flex w-full items-center justify-between rounded-tile px-3 py-2 text-left text-[13px] transition-colors hover:bg-muted",
                    !value.city ? "font-semibold text-ink" : "text-ink-2",
                  )}
                >
                  {t("results.allPoland")}
                  {!value.city && <Check className="h-3.5 w-3.5 text-brand-violet" />}
                </button>
              </li>
              {filtered.map((c) => {
                const active = value.city?.code === c.code;
                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          city: { lng: c.lng, lat: c.lat, city: c.name, code: c.code, label: c.name },
                          distanceKm: value.distanceKm || 25,
                        })
                      }
                      className={cn(
                        "flex w-full items-center gap-2 rounded-tile px-3 py-2 text-left text-[13px] transition-colors hover:bg-muted",
                        active ? "font-semibold text-ink" : "text-ink-2",
                      )}
                    >
                      <MapPin className="h-3.5 w-3.5 text-ink-4" />
                      <span className="flex-1">{c.name}</span>
                      {active && <Check className="h-3.5 w-3.5 text-brand-violet" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Radius applies only with a chosen city. */}
          {value.city && (
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
          )}
        </div>
      )}
    </Popover>
  );
}
