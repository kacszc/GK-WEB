"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";
import { locateWarsawDistrict, reverseGeocodeCity } from "@/lib/geo";

// Default view = whole of Poland (zoomed out) so any city is reachable; `center` overrides it.
const POLAND: [number, number] = [19.3, 52.0];
const POLAND_ZOOM = 5.2;

export type PickedLocation = { lat: number; lng: number; district: string };

/** Pick a point on the map; resolves the district (Warsaw GeoJSON, else reverse geocode). */
export function MapPickerDialog({
  open,
  onClose,
  onPick,
  center,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (loc: PickedLocation) => void;
  center?: [number, number] | null;
}) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [district, setDistrict] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!open || !containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: center ?? POLAND,
      zoom: center ? 11 : POLAND_ZOOM,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => map.resize());
    // The dialog animates in, so the container often has 0 size at init → the map renders blank.
    // Observe it and resize once it has real dimensions; also nudge a resize on the next frame.
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    requestAnimationFrame(() => map.resize());
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setPicked({ lat, lng });
      if (!markerRef.current) markerRef.current = new maplibregl.Marker({ color: "#7c3aed" });
      markerRef.current.setLngLat([lng, lat]).addTo(map);
      setResolving(true);
      void (async () => {
        try {
          const d = (await locateWarsawDistrict(lng, lat)) ?? (await reverseGeocodeCity(lat, lng)) ?? "";
          setDistrict(d);
        } finally {
          setResolving(false);
        }
      })();
    });
    mapRef.current = map;
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      setPicked(null);
      setDistrict("");
    };
  }, [open, center]);

  function confirm() {
    if (!picked) return;
    onPick({ lat: picked.lat, lng: picked.lng, district });
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("postJob.mapPickTitle")} size="lg">
      <p className="mb-2 text-[13px] text-ink-3">{t("postJob.mapPickHint")}</p>
      <div ref={containerRef} className="h-[360px] w-full overflow-hidden rounded-tile border border-line-3" />
      <p className="mt-3 flex items-center gap-1.5 text-[13px] text-ink-2">
        {picked ? (
          resolving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("postJob.mapPickResolving")}
            </>
          ) : (
            <span className="font-medium text-ink">{district || t("postJob.mapPickNoDistrict")}</span>
          )
        ) : (
          t("postJob.mapPickPrompt")
        )}
      </p>
      <Button
        variant="dark"
        onClick={confirm}
        disabled={!picked}
        className="mt-3 w-full rounded-tile py-3 text-sm disabled:opacity-40"
      >
        {t("postJob.mapPickConfirm")}
      </Button>
    </Dialog>
  );
}
