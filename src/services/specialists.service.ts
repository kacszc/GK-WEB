import type {
  Specialist,
  SpecialistSearch,
  Availability,
  SpecialistProfile,
  Review,
} from "@/lib/types";
import { apiGet } from "@/lib/api-client";
import { specialists } from "./mock-specialists";
import { mockDelay } from "./mock-data";
import { haversineKm } from "@/lib/geo";

/** Backend specialist DTO (search results). */
type SpecialistDto = {
  id: string;
  name: string;
  headline: string;
  district: string;
  trustScore: number;
  rating: number;
  reviews: number;
  rateFrom: number;
  availability: "NOW" | "WEEK" | "DATE";
  distanceKm: number;
  lat: number;
  lng: number;
};

/** Map backend availability enum casing to the frontend lowercase union. */
function availabilityFromBackend(a: SpecialistDto["availability"]): Availability {
  switch (a) {
    case "NOW":
      return "now";
    case "WEEK":
      return "week";
    default:
      return "date";
  }
}

/**
 * Adapt a backend DTO to the richer frontend `Specialist`. Fields the search
 * endpoint doesn't provide yet get neutral defaults (filled by the detail
 * endpoint / future API work).
 */
function toSpecialist(d: SpecialistDto, i: number): Specialist {
  return {
    id: d.id,
    name: d.name,
    avatarIndex: i,
    role: d.headline,
    trustScore: d.trustScore,
    availability: availabilityFromBackend(d.availability),
    kyc: d.trustScore >= 70,
    topRated: d.rating >= 4.8,
    district: d.district,
    distanceKm: d.distanceKm,
    rateFrom: d.rateFrom,
    rating: d.rating,
    reviews: d.reviews,
    specialties: [],
    languages: [],
    experienceYears: 0,
    lng: d.lng,
    lat: d.lat,
  };
}

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
    // Try the real backend first; on any failure, fall back to the mock below.
    try {
      const params = new URLSearchParams();
      if (filters.near) {
        params.set("lat", String(filters.near.lat));
        params.set("lng", String(filters.near.lng));
      }
      if (filters.maxDistanceKm != null) params.set("radiusKm", String(filters.maxDistanceKm));
      if (filters.q) params.set("q", filters.q);
      const qs = params.toString();
      const dtos = await apiGet<SpecialistDto[]>(
        `/api/specialists${qs ? `?${qs}` : ""}`,
        { locale: filters.locale },
      );
      const items = dtos.map(toSpecialist);
      return {
        items,
        total: items.length,
        availableNow: items.filter((s) => s.availability === "now").length,
        availableWeek: items.filter((s) => s.availability === "week").length,
      };
    } catch {
      // Backend unavailable — use mock data.
    }

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

  /** Full profile for a single specialist. */
  async getById(id: string): Promise<SpecialistProfile | null> {
    // TODO(backend): return apiGet(`/specialists/${id}`, { locale: filters.locale });
    await mockDelay(500, 1000);
    const s = specialists.find((x) => x.id === id);
    if (!s) return null;
    return { ...s, ...profileExtras(s) };
  },
};

// --- Mock profile detail (deterministic per specialist) ---

const REVIEW_AUTHORS = ["Marek W.", "Ewa S.", "Restauracja Vega", "Hotel Bristol", "Kamil R.", "Bar Tonic"];
const REVIEW_TEXTS = [
  "Świetny kontakt i pełen profesjonalizm. Zjawił się punktualnie i ogarnął temat bez problemu.",
  "Bardzo dobra współpraca, na pewno skorzystamy ponownie. Polecam!",
  "Doświadczenie widać od pierwszej minuty. Goście byli zachwyceni.",
  "Solidnie, szybko i bez żadnych niespodzianek. Duży plus za komunikację.",
  "Pomoc w ostatniej chwili — uratował nam event. Dziękujemy!",
];
const CERTS = ["Książeczka sanepidu", "Certyfikat baristy SCA", "Szkolenie BHP", "Kurs sommelierski", "HACCP"];

function profileExtras(s: Specialist): Omit<SpecialistProfile, keyof Specialist> {
  const i = s.avatarIndex;
  const reviews: Review[] = Array.from({ length: 3 }, (_, k) => ({
    author: REVIEW_AUTHORS[(i + k) % REVIEW_AUTHORS.length],
    rating: Math.min(5, Math.round((s.rating + (k % 2 === 0 ? 0.1 : -0.2)) * 2) / 2),
    date: ["2 tyg. temu", "1 mies. temu", "3 mies. temu"][k],
    text: REVIEW_TEXTS[(i + k) % REVIEW_TEXTS.length],
  }));
  return {
    bio: `${s.role}. ${s.experienceYears} lat doświadczenia w gastronomii i obsłudze eventów. Dyspozycyjność w okolicy: ${s.district}. Stawiam na punktualność, kulturę pracy i jakość.`,
    completedJobs: 40 + ((i * 17) % 160),
    responseTimeMin: [3, 5, 8, 12][i % 4],
    memberSince: `${2019 + (i % 5)}`,
    repeatClientsPct: 60 + ((i * 7) % 35),
    certifications: CERTS.filter((_, idx) => (i + idx) % 2 === 0).slice(0, 3),
    reviewList: reviews,
  };
}
