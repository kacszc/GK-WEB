"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useI18n } from "@/i18n/I18nProvider";
import { useContact } from "@/lib/ContactProvider";
import { geoService } from "@/services";
import { avatarColors, initials } from "@/lib/avatar";
import type { Specialist, Availability } from "@/lib/types";
import type { TFunction } from "@/i18n/translate";

const WARSAW: [number, number] = [21.0122, 52.2297];
/** Below this zoom the map shows ONLY district bubbles with counts ("Mokotów · 25") — no
 * individual pins. Privacy + clarity: exact-ish positions appear only after zooming in. */
const PIN_ZOOM = 12;
const AVAIL_COLOR: Record<Availability, string> = {
  now: "#22b33f",
  week: "#e0a400",
  date: "#f97316",
};

const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

/** Profiles store the district as free text, often with a city suffix ("Śródmieście, Warszawa")
 * while zones are named bare ("Śródmieście") — normalize both sides before matching. */
const normDistrict = (x: string) => x.split(",")[0].trim().toLowerCase();

function popupHtml(s: Specialist, t: TFunction): string {
  const color = avatarColors[s.avatarIndex % avatarColors.length];
  return `
    <div class="w-[240px]">
      <div class="flex items-start gap-2.5 pr-5">
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-ink/80" style="background:${color}">${initials(s.name)}</span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="truncate text-[13px] font-semibold text-ink">${s.name}</span>
          </div>
          <p class="truncate text-[11px] text-ink-3">${s.role}</p>
        </div>
      </div>
      <p class="mt-2 text-[12px] text-ink-2">${s.district} · ${t("results.km", { km: s.distanceKm })} · ${t(s.rateType === "monthly" ? "results.perMonth" : "results.perHour", { rate: s.rateFrom })} · ★ ${s.rating.toFixed(1)} (${s.reviews})</p>
      <div class="mt-2.5 flex gap-2">
        <a href="/specialist/${s.id}" class="flex-1 rounded-tile border border-line-2 px-3 py-1.5 text-center text-[12px] font-medium text-ink">${t("results.profile")}</a>
        <button type="button" data-skill-contact class="flex-1 rounded-tile bg-ink px-3 py-1.5 text-[12px] font-semibold text-white">${t("results.contact")}</button>
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
  const { open: openContact } = useContact();
  const openContactRef = useRef(openContact);
  useEffect(() => {
    openContactRef.current = openContact;
  }, [openContact]);

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
  const resizeObsRef = useRef<ResizeObserver | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  // Latest specialists/t for the popup effect (which depends only on activeId, to avoid
  // re-opening the popup on every filter change).
  const specialistsRef = useRef(specialists);
  useEffect(() => {
    specialistsRef.current = specialists;
  }, [specialists]);
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const suppressCloseRef = useRef(false); // true while we close a popup programmatically
  const initialCenterRef = useRef(center); // captured once for the initial camera

  // District-anchored positions: everything on the map (dots, popups, camera) anchors to the
  // specialist's DISTRICT centre, never their own coordinates.
  const zoneIndexRef = useRef<Map<string, { name: string; center: [number, number] }>>(new Map());
  useEffect(() => {
    zoneIndexRef.current = new Map(
      zones.map((z) => [normDistrict(z.name), { name: z.name, center: z.center }]),
    );
  }, [zones]);
  const posFor = useCallback((s: Specialist): [number, number] => {
    const z = zoneIndexRef.current.get(normDistrict(s.district));
    // No zone match — backend coords are already ~1 km coarse.
    return z ? z.center : [s.lng, s.lat];
  }, []);

  // Open a scrollable roster popup for one district (all its specialists in a list).
  const openClusterPopup = useCallback(
    (zoneName: string, center: [number, number], items: Specialist[]) => {
      const map = mapRef.current;
      if (!map) return;
      // Close whatever popup is open without clearing the list selection.
      if (popupRef.current) {
        suppressCloseRef.current = true;
        popupRef.current.remove();
        popupRef.current = null;
        suppressCloseRef.current = false;
      }
      const t = tRef.current;
      const rows = items
        .map((s) => {
          const color = avatarColors[s.avatarIndex % avatarColors.length];
          const rate = t(s.rateType === "monthly" ? "results.perMonth" : "results.perHour", { rate: s.rateFrom });
          return `
            <a href="/specialist/${s.id}" class="flex items-center gap-2.5 rounded-tile px-2 py-2 hover:bg-muted">
              <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-ink/80" style="background:${color}">${initials(s.name)}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[13px] font-semibold text-ink">${s.name}</span>
                <span class="block truncate text-[11px] text-ink-3">${s.role}</span>
              </span>
              <span class="flex shrink-0 items-center gap-1.5">
                <span class="h-2 w-2 rounded-full" style="background:${AVAIL_COLOR[s.availability]}"></span>
                <span class="text-[12px] font-bold text-ink">${rate}</span>
              </span>
            </a>`;
        })
        .join("");
      const html = `
        <div class="w-[280px]">
          <p class="mb-1.5 px-2 text-[12px] font-bold text-ink">${zoneName} <span class="text-ink-3">· ${items.length}</span></p>
          <div class="flex max-h-[248px] flex-col gap-0.5 overflow-y-auto overscroll-contain pr-1">${rows}</div>
        </div>`;
      const popup = new maplibregl.Popup({ offset: 18, closeButton: true, maxWidth: "320px" })
        .setLngLat(center)
        .setHTML(html)
        .addTo(map);
      popupRef.current = popup;
    },
    [],
  );

  // Roster for one zone, computed from the CURRENT results (used by bubble + dot clicks).
  const zoneItems = useCallback((zoneName: string): Specialist[] => {
    return specialistsRef.current.filter(
      (s) => zoneIndexRef.current.get(normDistrict(s.district))?.name === zoneName,
    );
  }, []);

  // Write the per-district specialist counts into the label badges. Kept in a ref because it's
  // called from two places with different timing: the counts effect (filter changes) and the
  // zones apply() (labels are rebuilt async after map load — after the effect may have run).
  const syncCountsRef = useRef(() => {});
  useEffect(() => {
    syncCountsRef.current = () => {
      // Count per canonical ZONE name (labels are keyed by it), matching districts normalized.
      const counts: Record<string, number> = {};
      for (const s of specialistsRef.current) {
        const z = zoneIndexRef.current.get(normDistrict(s.district));
        if (z) counts[z.name] = (counts[z.name] ?? 0) + 1;
      }
      labelElsRef.current.forEach((el, name) => {
        const n = counts[name] ?? 0;
        const badge = el.querySelector<HTMLElement>("[data-count]");
        if (badge) {
          badge.textContent = String(n);
          badge.style.display = n ? "" : "none";
        }
        el.style.opacity = n ? "1" : "0.55";
      });
    };
  });

  // District-mode toggle: pins only past PIN_ZOOM, district bubbles only before it.
  // Reads refs only, so the instance captured by the one-time init effect stays valid.
  const syncZoomModeRef = useRef(() => {});
  useEffect(() => {
    syncZoomModeRef.current = () => {
      const map = mapRef.current;
      if (!map) return;
      const pins = map.getZoom() >= PIN_ZOOM;
      markersRef.current.forEach((m) => {
        m.getElement().style.display = pins ? "" : "none";
      });
      labelElsRef.current.forEach((el) => {
        el.style.display = pins ? "none" : "";
      });
    };
  }, []);

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

    // Keep the canvas in sync when the container resizes (e.g. sidebar grows/shrinks).
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    resizeObsRef.current = ro;

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

    // Swap between district-bubble mode and pin mode as the user zooms.
    map.on("zoom", () => syncZoomModeRef.current());

    return () => {
      resizeObsRef.current?.disconnect();
      resizeObsRef.current = null;
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
        // Clickable district bubble ("Mokotów [25]") — the ONLY thing visible below PIN_ZOOM;
        // clicking zooms into the district, where individual pins take over.
        // IMPORTANT: MapLibre positions the marker via `transform: translate(...)` on the OUTER
        // element — any hover transform must live on an INNER element or the marker jumps away.
        const el = document.createElement("div");
        el.className = "cursor-pointer";
        const inner = document.createElement("span");
        inner.className =
          "flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-[#5b21b6] shadow-md ring-1 ring-black/5 transition-transform hover:scale-110";
        const nameEl = document.createElement("span");
        nameEl.textContent = z.name;
        const countEl = document.createElement("span");
        countEl.dataset.count = "";
        countEl.className =
          "-mr-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#5b21b6] px-1 text-[10px] font-bold leading-none text-white";
        inner.appendChild(nameEl);
        inner.appendChild(countEl);
        el.appendChild(inner);
        el.addEventListener("click", () => {
          map.flyTo({ center: z.center, zoom: PIN_ZOOM + 0.5, speed: 0.9 });
          // Straight to the district roster — no second click needed after the zoom.
          const items = zoneItems(z.name);
          if (items.length) openClusterPopup(z.name, z.center, items);
        });
        labelElsRef.current.set(z.name, el);
        return new maplibregl.Marker({ element: el }).setLngLat(z.center).addTo(map);
      });
      // Labels are (re)created async (after map load) — fill the counts in immediately so they
      // never render nameless-only when the counts effect already ran before this apply().
      syncCountsRef.current();
      syncZoomModeRef.current();
    };

    if (loadedRef.current) apply();
    else map.once("skill:ready", apply);
  }, [zones, zoneItems, openClusterPopup]);

  // Update label counts by MUTATING the existing label elements (no marker churn → no flicker).
  useEffect(() => {
    syncCountsRef.current();
  }, [specialists, zones]);

  // Specialist pins: per district ONE tight cluster at the zone centre — every specialist is a
  // dot on a small ring (pixel offsets, not geo scatter) and clicking ANY dot opens the
  // district's scrollable roster popup. Profiles without a zone match fall back to lone pins.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const mkDot = (availability: Availability) => {
      const el = document.createElement("button");
      el.className = "block border-0 bg-transparent p-0 cursor-pointer leading-none";
      const dot = document.createElement("span");
      dot.className =
        "block h-4 w-4 rounded-full border-2 border-white shadow-md transition-transform duration-150 hover:scale-125";
      dot.style.background = AVAIL_COLOR[availability];
      el.appendChild(dot);
      return el;
    };

    const build = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // Group by matched zone; keep the zone-less ones as individual pins.
      const groups = new Map<string, { name: string; center: [number, number]; items: Specialist[] }>();
      const loose: Specialist[] = [];
      for (const s of specialists) {
        const z = zoneIndexRef.current.get(normDistrict(s.district));
        if (!z) {
          loose.push(s);
          continue;
        }
        const g = groups.get(z.name) ?? { name: z.name, center: z.center, items: [] };
        g.items.push(s);
        groups.set(z.name, g);
      }

      groups.forEach((g) => {
        g.items.forEach((s, i) => {
          const el = mkDot(s.availability);
          el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            openClusterPopup(g.name, g.center, g.items);
          });
          // Ring layout in SCREEN pixels (stays tight at every zoom): 8 dots per ring,
          // single specialist sits exactly on the centre.
          const ring = Math.floor(i / 8);
          const angle = ((i % 8) / 8) * 2 * Math.PI + ring * 0.4;
          const r = g.items.length === 1 ? 0 : 11 + ring * 10;
          const offset: [number, number] = [Math.cos(angle) * r, Math.sin(angle) * r];
          markersRef.current.push(
            new maplibregl.Marker({ element: el, offset }).setLngLat(g.center).addTo(map),
          );
        });
      });

      loose.forEach((s) => {
        const el = mkDot(s.availability);
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          onSelectRef.current?.(s.id);
        });
        markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([s.lng, s.lat]).addTo(map));
      });

      // Freshly built pins must respect the current zoom mode (hidden at city zoom).
      syncZoomModeRef.current();
    };

    if (loadedRef.current) build();
    else map.once("skill:ready", build);
  }, [specialists, zones, openClusterPopup]);

  // Recenter when the chosen city changes.
  const cx = center?.[0];
  const cy = center?.[1];
  useEffect(() => {
    const map = mapRef.current;
    if (!map || cx == null || cy == null) return;
    map.flyTo({ center: [cx, cy], zoom: Math.max(map.getZoom(), 10.3), speed: 0.8 });
  }, [cx, cy]);

  // Open popup / fly to the active specialist. Depends ONLY on activeId so a filter change
  // (new specialists) never re-opens the popup on the previously-selected pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Close any existing popup programmatically (don't let it clear the selection).
    if (popupRef.current) {
      suppressCloseRef.current = true;
      popupRef.current.remove();
      popupRef.current = null;
      suppressCloseRef.current = false;
    }

    if (!activeId) return;
    const s = specialistsRef.current.find((x) => x.id === activeId);
    if (!s) return;

    // maxWidth must fit the fixed 240px content + the popup-content padding (14+18) so the right
    // padding isn't squeezed out (see .maplibregl-popup-content in globals.css).
    // Anchor the popup on the pin's district-anchored position (same as the marker).
    const at = posFor(s);
    const popup = new maplibregl.Popup({ offset: 16, closeButton: true, maxWidth: "280px" })
      .setLngLat(at)
      .setHTML(popupHtml(s, tRef.current))
      .addTo(map);
    // The popup is rendered as an HTML string (MapLibre setHTML), so the "Kontakt" button has no
    // React handler — wire it to the shared contact flow (same as SpecialistCard's open()).
    popup
      .getElement()
      ?.querySelector<HTMLButtonElement>("[data-skill-contact]")
      ?.addEventListener("click", () => openContactRef.current(s));
    // Closing the popup (X / click-away) deselects the pin so it won't reappear later.
    popup.on("close", () => {
      if (suppressCloseRef.current) return;
      onSelectRef.current?.(null);
    });
    popupRef.current = popup;
    // On mobile the popup opens above the pin and would otherwise be clipped by the top edge /
    // legend. Push the pin into the lower half (positive y offset) so the whole tile stays visible.
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    map.flyTo({
      center: at,
      zoom: Math.max(map.getZoom(), 12),
      speed: 0.8,
      offset: isMobile ? [0, 130] : [0, 0],
    });
  }, [activeId, posFor]);

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
