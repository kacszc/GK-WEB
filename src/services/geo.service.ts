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
  polygon: GeoJSON.Geometry;
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
};
