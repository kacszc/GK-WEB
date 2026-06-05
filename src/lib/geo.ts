// Geo helpers: haversine distance, point-in-polygon over the Warsaw districts
// GeoJSON, and a reverse-geocoding fallback (Nominatim) for cities outside Warsaw.

type LngLat = [number, number];

export function haversineKm(a: LngLat, b: LngLat): number {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function pointInRing(p: LngLat, ring: LngLat[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

type GeoFeature = {
  properties: { name: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
};

function pointInFeature(p: LngLat, f: GeoFeature): boolean {
  const polys =
    f.geometry.type === "MultiPolygon"
      ? (f.geometry.coordinates as number[][][][])
      : [f.geometry.coordinates as number[][][]];
  for (const poly of polys) {
    // first ring = outer boundary (holes ignored — good enough for districts)
    if (pointInRing(p, poly[0] as LngLat[])) return true;
  }
  return false;
}

let districtsCache: GeoFeature[] | null = null;

async function loadDistricts(): Promise<GeoFeature[]> {
  if (districtsCache) return districtsCache;
  const res = await fetch("/data/warsaw-districts.geojson");
  const json = await res.json();
  districtsCache = json.features as GeoFeature[];
  return districtsCache;
}

/** Returns the Warsaw district name containing [lng, lat], or null if outside. */
export async function locateWarsawDistrict(lng: number, lat: number): Promise<string | null> {
  const features = await loadDistricts();
  const hit = features.find((f) => pointInFeature([lng, lat], f));
  return hit?.properties.name ?? null;
}

/** Reverse-geocode to a city/town name (OpenStreetMap Nominatim). Best-effort. */
export async function reverseGeocodeCity(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&accept-language=pl`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    return a.city ?? a.town ?? a.municipality ?? a.village ?? a.county ?? a.state ?? null;
  } catch {
    return null;
  }
}
