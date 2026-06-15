import { apiGet } from "@/lib/api-client";
import { PL_CITIES } from "@/lib/cities";

/** A searchable city (search origin) from the backend. */
export type GeoCity = {
  code: string;
  name: string;
  lat: number;
  lng: number;
  defaultRadiusKm: number;
};

/** A map zone (district): label name + anchor + GeoJSON geometry (ready for MapLibre). */
export type GeoZone = {
  name: string;
  center: [number, number];
  color: string; // fill color (hex)
  borderColor: string; // outline color (hex)
  polygon: GeoJSON.Geometry;
};

/** A geocoder city suggestion (any city worldwide) — no curated districts, just a centre point. */
export type GeoCitySuggestion = {
  name: string;
  region: string; // state/county (may be empty)
  country: string;
  lat: number;
  lng: number;
};

// Offline fallback so the city picker still works when the backend is down (zones just won't show).
const FALLBACK_CITIES: GeoCity[] = PL_CITIES.map((c) => ({
  code: c.name,
  name: c.name,
  lat: c.lat,
  lng: c.lng,
  defaultRadiusKm: 25,
}));

export const geoService = {
  /** Searchable cities (search origins). Backend-defined → add a city by inserting a row. */
  async getCities(locale?: string): Promise<GeoCity[]> {
    try {
      return await apiGet<GeoCity[]>("/api/geo/cities", { locale });
    } catch {
      return FALLBACK_CITIES;
    }
  },

  /** Map zones (districts) for a city. Backend-defined → add zones by inserting rows. */
  async getZones(cityCode: string): Promise<GeoZone[]> {
    try {
      return await apiGet<GeoZone[]>(`/api/geo/cities/${encodeURIComponent(cityCode)}/zones`);
    } catch {
      return [];
    }
  },

  /** Autocomplete any city worldwide via the geocoder (cities outside the curated list). [] on error. */
  async searchCities(q: string, locale?: string): Promise<GeoCitySuggestion[]> {
    if (q.trim().length < 3) return [];
    try {
      return await apiGet<GeoCitySuggestion[]>(`/api/geo/search?q=${encodeURIComponent(q.trim())}`, { locale });
    } catch {
      return [];
    }
  },
};
