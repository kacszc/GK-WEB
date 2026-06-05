"use client";

import { useState } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { locateWarsawDistrict, reverseGeocodeCity } from "@/lib/geo";
import { cn } from "@/lib/cn";
import type { UserLocation } from "@/lib/types";

type State = "idle" | "locating" | "error";

export function LocationButton({
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

  function detect() {
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
      },
      () => setState("error"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  }

  if (value) {
    return (
      <button
        onClick={onClear}
        className="inline-flex w-full items-center gap-2 rounded-tile border border-brand-violet/30 bg-[#f6f3ff] px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-[#efe9ff]"
      >
        <MapPin className="h-4 w-4 text-brand-violet" />
        <span className="flex-1 truncate text-left">{value.label}</span>
        <X className="h-3.5 w-3.5 text-ink-4" />
      </button>
    );
  }

  return (
    <button
      onClick={detect}
      disabled={state === "locating"}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-tile border border-line-2 bg-surface px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-muted",
        state === "locating" && "cursor-wait opacity-70",
      )}
    >
      {state === "locating" ? (
        <Loader2 className="h-4 w-4 animate-spin text-brand-violet" />
      ) : (
        <MapPin className="h-4 w-4 text-brand-violet" />
      )}
      {state === "locating"
        ? t("results.locating")
        : state === "error"
          ? t("results.locationError")
          : t("results.useLocation")}
    </button>
  );
}
