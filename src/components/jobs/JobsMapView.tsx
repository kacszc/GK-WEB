"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useI18n } from "@/i18n/I18nProvider";
import { jobRateLabel } from "@/lib/jobRate";
import type { JobPosting } from "@/lib/types";

const WARSAW: [number, number] = [21.0122, 52.2297];

type TFunction = (key: string, params?: Record<string, string | number>) => string;

function popupHtml(j: JobPosting, t: TFunction): string {
  return `
    <div class="w-[230px]">
      <p class="text-[13px] font-semibold text-ink pr-5">${escapeHtml(j.title)}</p>
      <p class="mt-0.5 text-[12px] text-ink-3">${escapeHtml(j.profession)} · ${escapeHtml(j.district)}</p>
      <p class="mt-1 text-[12px] text-ink-2">${jobRateLabel(j, t)} · ${t("results.km", { km: j.distanceKm })}</p>
      <button data-apply="${j.id}" class="mt-2.5 w-full rounded-tile bg-ink px-3 py-1.5 text-[12px] font-semibold text-white">${t("jobs.apply")}</button>
    </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Map of job postings with price-pin markers; clicking a pin selects it / opens a popup. */
export function JobsMapView({
  jobs,
  activeId,
  onSelect,
  onApply,
  center,
}: {
  jobs: JobPosting[];
  activeId?: string | null;
  onSelect?: (id: string | null) => void;
  onApply?: (job: JobPosting) => void;
  center?: [number, number];
}) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  // Keep latest jobs/handlers for the activeId-only popup effect (so a filter change doesn't reopen).
  const jobsRef = useRef(jobs);
  const onApplyRef = useRef(onApply);
  const tRef = useRef<TFunction>(t);
  const suppressCloseRef = useRef(false);
  useEffect(() => {
    jobsRef.current = jobs;
    onApplyRef.current = onApply;
    tRef.current = t;
  });

  // Init once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: center ?? WARSAW,
      zoom: 10.3,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      loadedRef.current = true;
      map.resize();
    });
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    mapRef.current = map;
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild markers when the jobs change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = jobs
      .filter((j) => j.lat != null && j.lng != null)
      .map((j) => {
        const el = document.createElement("button");
        el.className =
          "rounded-full border border-line-2 bg-surface px-2 py-1 text-[11px] font-bold text-ink shadow-sm transition-colors hover:bg-ink hover:text-on-dark";
        el.textContent =
          j.rateDisclosed === false ? tRef.current("jobs.rateToAgreeShort") : `${j.rate} ${j.currency || "PLN"}`;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelect?.(j.id);
        });
        return new maplibregl.Marker({ element: el }).setLngLat([j.lng!, j.lat!]).addTo(map);
      });
  }, [jobs, onSelect]);

  // Open popup / fly to the active job. Depends ONLY on activeId.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (popupRef.current) {
      suppressCloseRef.current = true;
      popupRef.current.remove();
      popupRef.current = null;
      suppressCloseRef.current = false;
    }
    if (!activeId) return;
    const job = jobsRef.current.find((j) => j.id === activeId);
    if (!job || job.lat == null || job.lng == null) return;
    map.flyTo({ center: [job.lng, job.lat], zoom: Math.max(map.getZoom(), 12), duration: 600 });
    const popup = new maplibregl.Popup({ offset: 16, closeButton: true, maxWidth: "260px" })
      .setLngLat([job.lng, job.lat])
      .setHTML(popupHtml(job, tRef.current))
      .addTo(map);
    popup.getElement()?.querySelector<HTMLButtonElement>("button[data-apply]")?.addEventListener("click", () => {
      onApplyRef.current?.(job);
    });
    popup.on("close", () => {
      if (!suppressCloseRef.current) onSelect?.(null);
    });
    popupRef.current = popup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-panel border border-line-3">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
