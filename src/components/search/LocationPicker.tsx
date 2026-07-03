"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Loader2, ChevronDown, Navigation, Check, Globe } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { useI18n } from "@/i18n/I18nProvider";
import { locateWarsawDistrict, reverseGeocodeCity } from "@/lib/geo";
import { geoService } from "@/services";
import type { UserLocation } from "@/lib/types";
import { cn } from "@/lib/cn";

type State = "idle" | "locating" | "error";

/**
 * Location control: the city is changeable (default Warsaw). Pick a city from the list, use the
 * browser geolocation, or reset to the default. Selecting re-centres the search (lat/lng) and
 * updates the results title.
 */
export function LocationPicker({
  value,
  onLocate,
  onClear,
  radiusKm,
  onRadiusChange,
  radiusBounds,
}: {
  value: UserLocation | null;
  onLocate: (loc: UserLocation) => void;
  onClear: () => void;
  /** Optional search radius (km). When {@code onRadiusChange} is provided, a slider is shown right
   * under the city control once a city is picked — the "zasięg" lives with the location, not in the
   * filter list. Omitting these props (e.g. the profile base-location picker) hides the slider. */
  radiusKm?: number;
  onRadiusChange?: (km: number | undefined) => void;
  radiusBounds?: { min: number; max: number; defaultValue: number };
}) {
  const { t, locale } = useI18n();
  const [state, setState] = useState<State>("idle");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  // Cities are backend-defined (geo.city) — add a city by inserting a row, no frontend change.
  const { data: cities = [] } = useQuery({
    queryKey: ["geoCities", locale],
    queryFn: () => geoService.getCities(locale),
  });

  // Debounce the geocoder lookup so any city worldwide (Sosnowiec, Chorzów…) can be a search origin,
  // not just the curated list. Mirrors the post-job CityCombobox.
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

  const defaultCity = cities[0]?.name ?? "Warszawa";
  // No city selected = no anchor = search all of Poland (backend returns everyone, promoted first).
  const currentLabel = value?.label ?? t("results.allPoland");
  const currentCity = value?.city ?? defaultCity;

  function detect(close: () => void) {
    if (!navigator.geolocation) {
      setState("error");
      return;
    }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { longitude: lng, latitude: lat } = pos.coords;
        const district = await locateWarsawDistrict(lng, lat);
        if (district) {
          onLocate({ lng, lat, district, city: "Warszawa", code: "warszawa", label: `Warszawa · ${district}` });
        } else {
          const city = await reverseGeocodeCity(lat, lng);
          onLocate({ lng, lat, city: city ?? undefined, label: city ?? t("results.useLocation") });
        }
        setState("idle");
        close();
      },
      () => setState("error"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = cities.filter((c) => c.name.toLowerCase().includes(q));
  // Worldwide geocoder hits, minus any that are already a curated city.
  const curatedNames = new Set(cities.map((c) => c.name.toLowerCase()));
  const geoOnly = geo.filter((g) => !curatedNames.has(g.name.toLowerCase()));

  const bounds = radiusBounds ?? { min: 1, max: 50, defaultValue: 25 };
  const showRadius = !!onRadiusChange && !!value;

  return (
    <div className="w-full">
    <Popover
      align="start"
      portal
      triggerClassName="w-full"
      trigger={({ open }) => (
        <span
          className={cn(
            "inline-flex w-full items-center gap-2 rounded-tile border px-3 py-2 text-[13px] font-medium text-ink transition-colors",
            value
              ? "border-brand-violet/30 bg-[#f6f3ff] hover:bg-[#efe9ff]"
              : "border-line-2 bg-surface hover:bg-muted",
          )}
        >
          <MapPin className="h-4 w-4 text-brand-violet" />
          <span className="flex-1 truncate text-left">{currentLabel}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-ink-4 transition-transform", open && "rotate-180")} />
        </span>
      )}
    >
      {({ close }) => (
        <div className="w-full">
          <button
            type="button"
            onClick={() => detect(close)}
            disabled={state === "locating"}
            className="mb-2 inline-flex w-full items-center gap-2 rounded-tile border border-line-2 bg-surface px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-70"
          >
            {state === "locating" ? (
              <Loader2 className="h-4 w-4 animate-spin text-brand-violet" />
            ) : (
              <Navigation className="h-4 w-4 text-brand-violet" />
            )}
            {state === "locating"
              ? t("results.locating")
              : state === "error"
                ? t("results.locationError")
                : t("results.useLocation")}
          </button>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("results.searchCity")}
            className="mb-2 w-full rounded-tile border border-line-2 bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-ink placeholder:text-ink-4"
          />

          <ul className="max-h-[240px] overflow-y-auto">
            {filtered.map((c) => {
              const active = c.name === currentCity;
              return (
                <li key={c.name}>
                  <button
                    type="button"
                    onClick={() => {
                      onLocate({ lng: c.lng, lat: c.lat, city: c.name, code: c.code, label: c.name });
                      close();
                    }}
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

            {/* Worldwide geocoder results — any city outside the curated list (no districts). */}
            {(geoOnly.length > 0 || (debounced.length >= 3 && isFetching)) && (
              <li className="mt-1 flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold tracking-[0.3px] text-ink-4">
                <Globe className="h-3 w-3" />
                {t("results.otherCities")}
                {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
              </li>
            )}
            {geoOnly.map((g) => (
              <li key={`${g.name}-${g.lat}-${g.lng}`}>
                <button
                  type="button"
                  onClick={() => {
                    onLocate({ lng: g.lng, lat: g.lat, city: g.name, label: g.name });
                    close();
                  }}
                  className="flex w-full items-center gap-2 rounded-tile px-3 py-2 text-left text-[13px] text-ink-2 transition-colors hover:bg-muted"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-4" />
                  <span className="flex-1 truncate">
                    {g.name}
                    {(g.region || g.country) && (
                      <span className="text-ink-4">{" · "}{[g.region, g.country].filter(Boolean).join(", ")}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}

            {filtered.length === 0 && geoOnly.length === 0 && !isFetching && (
              <li className="px-3 py-3 text-center text-[12px] text-ink-4">
                {debounced.length >= 3 ? t("results.cityNoResults") : t("results.cityHint")}
              </li>
            )}
          </ul>

          {value && (
            <button
              type="button"
              onClick={() => {
                onClear();
                close();
              }}
              className="mt-2 w-full rounded-tile px-3 py-2 text-left text-[12px] font-medium text-ink-3 hover:text-ink"
            >
              {t("results.resetLocation")}
            </button>
          )}
        </div>
      )}
    </Popover>

      {/* Search radius (zasięg) — lives with the location, shown only after a city is picked. Clearing
          the cap (undefined) drops the geo limit; the slider greys out but re-enables when dragged. */}
      {showRadius && (
        <div className="mt-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-semibold text-ink-2">
              {radiusKm != null ? t("filters.upTo", { km: radiusKm }) : t("results.fAnyDistance")}
            </div>
            {radiusKm != null && (
              <button
                type="button"
                onClick={() => onRadiusChange?.(undefined)}
                className="shrink-0 text-[12px] font-medium text-ink-3 hover:text-ink"
              >
                {t("results.fAnyDistanceAction")}
              </button>
            )}
          </div>
          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            value={radiusKm ?? bounds.defaultValue}
            onChange={(e) => onRadiusChange?.(Number(e.target.value))}
            className={cn(
              "mt-1 w-full cursor-pointer accent-brand-violet",
              radiusKm == null && "opacity-40",
            )}
          />
        </div>
      )}
    </div>
  );
}
