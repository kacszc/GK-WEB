"use client";

import { useState } from "react";
import { MapPin, Loader2, ChevronDown, Navigation, Check } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { useI18n } from "@/i18n/I18nProvider";
import { locateWarsawDistrict, reverseGeocodeCity } from "@/lib/geo";
import { PL_CITIES, DEFAULT_CITY } from "@/lib/cities";
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
}: {
  value: UserLocation | null;
  onLocate: (loc: UserLocation) => void;
  onClear: () => void;
}) {
  const { t } = useI18n();
  const [state, setState] = useState<State>("idle");
  const [query, setQuery] = useState("");

  const currentLabel = value?.label ?? DEFAULT_CITY.name;
  const currentCity = value?.city ?? DEFAULT_CITY.name;

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
          onLocate({ lng, lat, district, city: "Warszawa", label: `Warszawa · ${district}` });
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

  const filtered = PL_CITIES.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Popover
      align="start"
      triggerClassName="w-full"
      panelClassName="w-full"
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
                      onLocate({ lng: c.lng, lat: c.lat, city: c.name, label: c.name });
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
  );
}
