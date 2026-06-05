"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useI18n } from "@/i18n/I18nProvider";
import { warsawDistricts } from "@/services/warsaw-districts";
import { avatarColors, initials } from "@/lib/avatar";
import type { Specialist, Availability } from "@/lib/types";
import type { TFunction } from "@/i18n/translate";

const WARSAW: [number, number] = [21.0122, 52.2297];
const AVAIL_COLOR: Record<Availability, string> = {
  now: "#22b33f",
  week: "#e0a400",
  date: "#f97316",
};

function popupHtml(s: Specialist, t: TFunction): string {
  const color = avatarColors[s.avatarIndex % avatarColors.length];
  return `
    <div class="w-[240px] p-1">
      <div class="flex items-start gap-2.5">
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
        <button class="flex-1 rounded-tile border border-line-2 px-3 py-1.5 text-[12px] font-medium text-ink">${t("results.profile")}</button>
        <button class="flex-1 rounded-tile bg-ink px-3 py-1.5 text-[12px] font-semibold text-white">${t("results.contact")}</button>
      </div>
    </div>`;
}

export function MapView({
  specialists,
  activeId,
  onSelect,
}: {
  specialists: Specialist[];
  activeId?: string | null;
  onSelect?: (id: string | null) => void;
}) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const districtMarkersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: WARSAW,
      zoom: 10.3,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("districts", { type: "geojson", data: "/data/warsaw-districts.geojson" });
      map.addLayer({
        id: "districts-fill",
        type: "fill",
        source: "districts",
        paint: { "fill-color": "#7c3aed", "fill-opacity": 0.05 },
      });
      map.addLayer({
        id: "districts-line",
        type: "line",
        source: "districts",
        paint: { "line-color": "#7c3aed", "line-opacity": 0.35, "line-width": 1.2, "line-dasharray": [2, 2] },
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

  // (Re)build markers when the specialist set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const build = () => {
      // specialist pins
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = specialists.map((s) => {
        // Outer element keeps MapLibre's positioning transform untouched;
        // the inner dot handles the hover scale (avoids the pin "jumping").
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

      // district labels with counts
      districtMarkersRef.current.forEach((m) => m.remove());
      const counts: Record<string, number> = {};
      for (const s of specialists) counts[s.district] = (counts[s.district] ?? 0) + 1;
      districtMarkersRef.current = warsawDistricts.map((d) => {
        const el = document.createElement("div");
        el.className =
          "pointer-events-none whitespace-nowrap rounded-full bg-white/85 px-1.5 py-0.5 text-[10px] font-semibold text-[#5b21b6] shadow-sm";
        el.textContent = counts[d.name] ? `${d.name} · ${counts[d.name]}` : d.name;
        if (!counts[d.name]) el.style.opacity = "0.5";
        return new maplibregl.Marker({ element: el }).setLngLat(d.center).addTo(map);
      });
    };

    if (loadedRef.current) build();
    else map.once("skill:ready", build);
  }, [specialists]);

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
