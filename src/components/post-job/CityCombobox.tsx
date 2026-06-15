"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ChevronDown, Loader2, Globe, Check } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { geoService, type GeoCity } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

/** A picked city: a curated one (code set → districts available) or a geocoded place (code = ""). */
export type PickedCity = { code: string; name: string; lat: number; lng: number };

/**
 * City picker with autocomplete. Shows the curated backend cities (which have districts) first; once
 * the query is 3+ chars it also queries the geocoder for ANY city worldwide (Oslo, Roma, New York…).
 * Picking a geocoded city sets code = "" (no districts — the caller pins the city centre).
 */
export function CityCombobox({
  cityCode,
  cityName,
  onPick,
}: {
  cityCode: string;
  cityName: string;
  onPick: (c: PickedCity) => void;
}) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  const { data: cities = [] } = useQuery({
    queryKey: ["geoCities", locale],
    queryFn: () => geoService.getCities(locale),
  });

  // Debounce the geocoder lookup (typeahead) to respect the geocoder's rate limit.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(id);
  }, [query]);

  const { data: geo = [], isFetching } = useQuery({
    queryKey: ["geoCitySearch", debounced, locale],
    queryFn: () => geoService.searchCities(debounced, locale),
    enabled: debounced.length >= 3,
    staleTime: 5 * 60_000,
  });

  const q = query.trim().toLowerCase();
  const curated = q ? cities.filter((c) => c.name.toLowerCase().includes(q)) : cities;
  const curatedNames = new Set(cities.map((c) => c.name.toLowerCase()));
  // Don't repeat a geocoded place that's already a curated city.
  const geoOnly = geo.filter((g) => !curatedNames.has(g.name.toLowerCase()));

  const label = cityName || t("postJob.cityPlaceholder");

  function pickCurated(c: GeoCity, close: () => void) {
    onPick({ code: c.code, name: c.name, lat: c.lat, lng: c.lng });
    close();
  }

  return (
    <Popover
      align="start"
      triggerClassName="w-full"
      panelClassName="w-full"
      trigger={({ open }) => (
        <span
          className={cn(
            "mt-1.5 inline-flex w-full items-center gap-2 rounded-tile border px-3 py-2.5 text-sm transition-colors",
            cityName ? "border-line-2 text-ink" : "border-line-2 text-ink-4",
            "hover:bg-muted",
          )}
        >
          <MapPin className="h-4 w-4 shrink-0 text-brand-violet" />
          <span className="flex-1 truncate text-left">{label}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-ink-4 transition-transform", open && "rotate-180")} />
        </span>
      )}
    >
      {({ close }) => (
        <div className="w-full">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("postJob.citySearchPlaceholder")}
            className="mb-2 w-full rounded-tile border border-line-2 bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-ink placeholder:text-ink-4"
          />

          <ul className="max-h-[280px] overflow-y-auto">
            {curated.map((c) => {
              const active = c.code === cityCode;
              return (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => pickCurated(c, close)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-tile px-3 py-2 text-left text-[13px] transition-colors hover:bg-muted",
                      active ? "font-semibold text-ink" : "text-ink-2",
                    )}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-4" />
                    <span className="flex-1 truncate">{c.name}</span>
                    {active && <Check className="h-3.5 w-3.5 shrink-0 text-brand-violet" />}
                  </button>
                </li>
              );
            })}

            {/* Worldwide geocoder results — cities outside the curated list (no districts). */}
            {(geoOnly.length > 0 || (debounced.length >= 3 && isFetching)) && (
              <li className="mt-1 flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold tracking-[0.3px] text-ink-4">
                <Globe className="h-3 w-3" />
                {t("postJob.otherCities")}
                {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
              </li>
            )}
            {geoOnly.map((g) => (
              <li key={`${g.name}-${g.lat}-${g.lng}`}>
                <button
                  type="button"
                  onClick={() => {
                    onPick({ code: "", name: g.name, lat: g.lat, lng: g.lng });
                    close();
                  }}
                  className="flex w-full items-center gap-2 rounded-tile px-3 py-2 text-left text-[13px] text-ink-2 transition-colors hover:bg-muted"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-4" />
                  <span className="flex-1 truncate">
                    {g.name}
                    {(g.region || g.country) && (
                      <span className="text-ink-4">
                        {" · "}
                        {[g.region, g.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}

            {curated.length === 0 && geoOnly.length === 0 && !isFetching && (
              <li className="px-3 py-3 text-center text-[12px] text-ink-4">
                {debounced.length >= 3 ? t("postJob.cityNoResults") : t("postJob.cityHint")}
              </li>
            )}
          </ul>
        </div>
      )}
    </Popover>
  );
}
