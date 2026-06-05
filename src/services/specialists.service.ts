import type { Specialist, SpecialistSearch, Availability } from "@/lib/types";
// import { apiGet } from "@/lib/api-client";
import { specialists } from "./mock-specialists";
import { mockDelay } from "./mock-data";
import { haversineKm } from "@/lib/geo";

export type SpecialistSort = "trust" | "distance" | "rate";

export type SpecialistFilters = {
  q?: string;
  minTrust?: number;
  maxDistanceKm?: number;
  availability?: Availability[];
  specialties?: string[];
  rateMin?: number;
  rateMax?: number;
  kyc?: boolean;
  languages?: string[];
  sort?: SpecialistSort;
  near?: { lng: number; lat: number }; // recompute distance from user's location
  locale?: string;
};

function matches(s: Specialist, f: SpecialistFilters): boolean {
  const q = f.q?.trim().toLowerCase();
  if (q) {
    const hay = `${s.name} ${s.role} ${s.specialties.map((x) => x.label).join(" ")}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.minTrust != null && s.trustScore < f.minTrust) return false;
  if (f.maxDistanceKm != null && s.distanceKm > f.maxDistanceKm) return false;
  if (f.availability?.length && !f.availability.includes(s.availability)) return false;
  if (f.kyc && !s.kyc) return false;
  if (f.rateMin != null && s.rateFrom < f.rateMin) return false;
  if (f.rateMax != null && s.rateFrom > f.rateMax) return false;
  if (f.specialties?.length) {
    const labels = s.specialties.map((x) => x.label.toLowerCase());
    if (!f.specialties.some((sp) => labels.includes(sp.toLowerCase()))) return false;
  }
  if (f.languages?.length && !f.languages.some((l) => s.languages.includes(l))) return false;
  return true;
}

function sortBy(sort: SpecialistSort | undefined) {
  return (a: Specialist, b: Specialist) => {
    if (sort === "distance") return a.distanceKm - b.distanceKm;
    if (sort === "rate") return a.rateFrom - b.rateFrom;
    // default: trust (then rating)
    return b.trustScore - a.trustScore || b.rating - a.rating;
  };
}

// Facet counts over the full dataset (for sidebar option counts). From backend later.
function countBy<T>(arr: T[], key: (x: T) => string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of arr) for (const k of key(item)) out[k] = (out[k] ?? 0) + 1;
  return out;
}

export const specialistFacets = {
  specialties: countBy(specialists, (s) => s.specialties.map((x) => x.label)),
  availability: countBy(specialists, (s) => [s.availability]),
  languages: countBy(specialists, (s) => s.languages),
  kyc: specialists.filter((s) => s.kyc).length,
  total: specialists.length,
};

export const specialistsService = {
  /**
   * Search specialists. Returns ALL matching items (the screen paginates the
   * list client-side and the map uses the full set) plus availability facets.
   */
  async search(filters: SpecialistFilters = {}): Promise<SpecialistSearch> {
    // TODO(backend): return apiGet(`/specialists/search?${qs}`, { locale: filters.locale });
    await mockDelay(650, 1200); // simulate a realistic network round-trip

    // If we know the user's location, recompute real distances from it.
    const pool = filters.near
      ? specialists.map((s) => ({
          ...s,
          distanceKm: Math.round(haversineKm([filters.near!.lng, filters.near!.lat], [s.lng, s.lat])),
        }))
      : specialists;

    const items = pool.filter((s) => matches(s, filters)).sort(sortBy(filters.sort));

    return {
      items,
      total: items.length,
      availableNow: items.filter((s) => s.availability === "now").length,
      availableWeek: items.filter((s) => s.availability === "week").length,
    };
  },
};
