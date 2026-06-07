"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useI18n } from "@/i18n/I18nProvider";
import { geoService } from "@/services";
import { avatarColors, initials } from "@/lib/avatar";
import type { Specialist, Availability } from "@/lib/types";
import type { TFunction } from "@/i18n/translate";

const WARSAW: [number, number] = [21.0122, 52.2297];
const AVAIL_COLOR: Record<Availability, string> = {
  now: "#22b33f",
  week: "#e0a400",
  date: "#f97316",
};

const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

function popupHtml(s: Specialist, t: TFunction): string {
  const color = avatarColors[s.avatarIndex % avatarColors.length];
  return `
    <div class="w-[240px]">
      <div class="flex items-start gap-2.5 pr-5">
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-ink/80" style="background:${color}">${initials(s.name)}</span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="truncate text-[13px] font-semibold text-ink">${s.name}</span>
            <span class="rounded-full bg-success-badge px-1.5 py-0.5 text-[10px] font-bold text-white">★ ${s.trustScore}</span>
          </div>
          <p class="truncate text-[11px] text-ink-3">${s.role}</p>
        </div>
      </div>
      <p class="mt-2 text-[12px] text-ink-2">${s.district} · ${t("results.km", { km: s.distanceKm })} · ${t("results.perHour", { rate: s.rateFrom })} · ★ ${s.rating.toFixed(1)} (${s.reviews})</p>
      <div class="mt-2.5 flex gap-2">
        <a href="/specialist/${s.id}" class="flex-1 rounded-tile border border-line-2 px-3 py-1.5 text-center text-[12px] font-medium text-ink">${t("results.profile")}</a>
        <button class="flex-1 rounded-tile bg-ink px-3 py-1.5 text-[12px] font-semibold text-white">${t("results.contact")}</button>
      </div>
    </div>`;
}

export function MapView({
  specialists,
  activeId,
  onSelect,
  cityCode = "warszawa",
  center,
}: {
  specialists: Specialist[];
  activeId?: string | null;
  onSelect?: (id: string | null) => void;
  cityCode?: string;
  center?: [number, number];
}) {
  const { t } = useI18n();

  // Zones (districts) come from the backend per city — add zones by inserting rows, not code.
  const { data: zones = [] } = useQuery({
    queryKey: ["geoZones", cityCode],
    queryFn: () => geoService.getZones(cityCode),
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const districtMarkersRef = useRef<maplibregl.Marker[]>([]);
  const labelElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  const initialCenterRef = useRef(center); // captured once for the initial camera

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: initialCenterRef.current ?? WARSAW,
      zoom: 10.3,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("districts", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "districts-fill",
        type: "fill",
        source: "districts",
        // Per-zone color from the backend (feature property), brand violet as fallback.
        paint: { "fill-color": ["coalesce", ["get", "color"], "#7c3aed"], "fill-opacity": 0.08 },
      });
      map.addLayer({
        id: "districts-line",
        type: "line",
        source: "districts",
        paint: {
          "line-color": ["coalesce", ["get", "borderColor"], "#7c3aed"],
          "line-opacity": 0.4,
          "line-width": 1.2,
          "line-dasharray": [2, 2],
        },
      });
      loadedRef.current = true;
      map.fire("skill:ready");
    });

    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  // Build the zone polygons + label markers ONCE per city (when zones change). Rebuilding these on
  // every filter change is what made the labels flicker — counts are updated separately below.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const fc: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: zones.map((z) => ({
          type: "Feature",
          properties: { name: z.name, color: z.color, borderColor: z.borderColor },
          geometry: z.polygon,
        })),
      };
      const src = map.getSource("districts") as maplibregl.GeoJSONSource | undefined;
      src?.setData(fc);

      districtMarkersRef.current.forEach((m) => m.remove());
      labelElsRef.current = new Map();
      districtMarkersRef.current = zones.map((z) => {
        const el = document.createElement("div");
        el.className =
          "pointer-events-none whitespace-nowrap rounded-full bg-white/85 px-1.5 py-0.5 text-[10px] font-semibold text-[#5b21b6] shadow-sm";
        el.textContent = z.name;
        labelElsRef.current.set(z.name, el);
        return new maplibregl.Marker({ element: el }).setLngLat(z.center).addTo(map);
      });
    };

    if (loadedRef.current) apply();
    else map.once("skill:ready", apply);
  }, [zones]);

  // Update label counts by MUTATING the existing label elements (no marker churn → no flicker).
  useEffect(() => {
    const counts: Record<string, number> = {};
    for (const s of specialists) counts[s.district] = (counts[s.district] ?? 0) + 1;
    for (const z of zones) {
      const el = labelElsRef.current.get(z.name);
      if (!el) continue;
      const n = counts[z.name] ?? 0;
      el.textContent = n ? `${z.name} · ${n}` : z.name;
      el.style.opacity = n ? "1" : "0.5";
    }
  }, [specialists, zones]);

  // Specialist pins.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const build = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = specialists.map((s) => {
        const el = document.createElement("button");
        el.className = "block border-0 bg-transparent p-0 cursor-pointer leading-none";
        const dot = document.createElement("span");
        dot.className =
          "block h-4 w-4 rounded-full border-2 border-white shadow-md transition-transform duration-150 hover:scale-125";
        dot.style.background = AVAIL_COLOR[s.availability];
        el.appendChild(dot);
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          onSelectRef.current?.(s.id);
        });
        return new maplibregl.Marker({ element: el }).setLngLat([s.lng, s.lat]).addTo(map);
      });
    };

    if (loadedRef.current) build();
    else map.once("skill:ready", build);
  }, [specialists]);

  // Recenter when the chosen city changes.
  const cx = center?.[0];
  const cy = center?.[1];
  useEffect(() => {
    const map = mapRef.current;
    if (!map || cx == null || cy == null) return;
    map.flyTo({ center: [cx, cy], zoom: Math.max(map.getZoom(), 10.3), speed: 0.8 });
  }, [cx, cy]);

  // Open popup / fly to the active specialist.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeId) return;
    const s = specialists.find((x) => x.id === activeId);
    if (!s) return;
    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup({ offset: 16, closeButton: true, maxWidth: "260px" })
      .setLngLat([s.lng, s.lat])
      .setHTML(popupHtml(s, t))
      .addTo(map);
    map.flyTo({ center: [s.lng, s.lat], zoom: Math.max(map.getZoom(), 12), speed: 0.8 });
  }, [activeId, specialists, t]);

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-panel border border-line-3">
      <div ref={containerRef} className="h-full w-full" />

      {/* Legend */}
      <div className="absolute left-4 top-4 z-10 rounded-tile border border-line-3 bg-surface/95 p-3 text-[12px] shadow-sm">
        <p className="mb-1.5 text-[11px] font-bold tracking-[0.5px] text-ink-3">{t("results.legendTitle")}</p>
        <Legend color={AVAIL_COLOR.now} label={t("results.fAvailNow")} />
        <Legend color={AVAIL_COLOR.week} label={t("results.fAvailWeek")} />
        <Legend color={AVAIL_COLOR.date} label={t("results.fAvailDate")} />
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
