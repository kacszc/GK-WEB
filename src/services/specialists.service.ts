import type { Specialist, SpecialistSearch, Availability, SpecialistProfile } from "@/lib/types";
import { apiGet } from "@/lib/api-client";

/** Backend specialist DTO (search results + detail; detail adds the optional fields). */
type SpecialistDto = {
  id: string;
  name: string;
  headline: string;
  district: string;
  trustScore: number;
  rating: number | null;
  reviews: number | null;
  rateFrom: number;
  availability: "NOW" | "WEEK" | "DATE";
  distanceKm: number;
  lat: number;
  lng: number;
  // Detail-only fields.
  completedJobs?: number;
  memberSince?: number; // year, e.g. 2026 (0 when unknown)
  repeatClientsPct?: number; // % of completed jobs from repeat employers
  certifications?: string[]; // display labels (specialist-managed)
  specializations?: { code: string; label: string }[]; // localized labels
  languages?: string[]; // codes, e.g. ["pl","en"] — localized in the UI
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
 * Adapt a backend DTO to the richer frontend `Specialist`. Fields the search endpoint doesn't
 * provide yet get neutral defaults (filled by the detail endpoint / future API work).
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
    topRated: (d.rating ?? 0) >= 4.8,
    district: d.district,
    distanceKm: d.distanceKm,
    rateFrom: d.rateFrom,
    rating: d.rating ?? 0,
    reviews: d.reviews ?? 0,
    specialties: [],
    languages: [],
    experienceYears: 0,
    lng: d.lng,
    lat: d.lat,
  };
}

/** Profile fields beyond the base card. `completedJobs` and `memberSince` come from the backend
 * detail DTO; the rest have no data source yet (the UI hides those sections when empty). Real
 * reviews/portfolio are loaded separately by the profile page. */
function profileExtras(
  base: Specialist,
  completedJobs: number,
  memberSince: number,
  repeatClientsPct: number,
  certifications: string[],
): Omit<SpecialistProfile, keyof Specialist> {
  return {
    bio: base.role ? `${base.role}. Dyspozycyjność w okolicy: ${base.district}.` : "",
    completedJobs,
    responseTimeMin: 0, // needs message-response tracking → section hidden in the UI
    memberSince: memberSince > 0 ? String(memberSince) : "",
    repeatClientsPct, // real (from completed jobs); UI hides it at 0
    certifications, // specialist-managed; UI hides the section when empty
    reviewList: [],
  };
}

export type SpecialistSort = "trust" | "distance" | "rate";

export type SpecialistFilters = {
  q?: string;
  professions?: string[]; // specific specialization codes (any-of)
  industries?: string[]; // whole-industry codes (any-of) — selected as a unit, no small codes ticked
  customIndustries?: string[]; // "Inne" per industry — matches specialists with a custom role in that industry
  minTrust?: number;
  maxDistanceKm?: number;
  availability?: Availability[];
  specialties?: string[];
  rateMin?: number;
  rateMax?: number;
  kyc?: boolean;
  languages?: string[];
  sort?: SpecialistSort;
  near?: { lng: number; lat: number };
  /** "When" range (ISO yyyy-mm-dd) — flags specialists not fully free in the term (warning, not a cut). */
  fromDate?: string;
  toDate?: string;
  page?: number; // 0-indexed page (server-side pagination)
  size?: number; // page size
  locale?: string;
};

export const specialistsService = {
  /** Search specialists (all matching items + availability facets). Backend only. */
  async search(filters: SpecialistFilters = {}): Promise<SpecialistSearch> {
    const params = new URLSearchParams();
    if (filters.near) {
      params.set("lat", String(filters.near.lat));
      params.set("lng", String(filters.near.lng));
    }
    if (filters.maxDistanceKm != null) params.set("radiusKm", String(filters.maxDistanceKm));
    if (filters.q) params.set("q", filters.q);
    if (filters.professions?.length) params.set("professions", filters.professions.join(","));
    if (filters.industries?.length) params.set("industries", filters.industries.join(","));
    if (filters.customIndustries?.length) params.set("customIndustries", filters.customIndustries.join(","));
    if (filters.minTrust != null) params.set("minTrust", String(filters.minTrust));
    if (filters.availability?.length) {
      params.set("availability", filters.availability.map((a) => a.toUpperCase()).join(","));
    }
    if (filters.rateMin != null) params.set("rateMin", String(filters.rateMin));
    if (filters.rateMax != null) params.set("rateMax", String(filters.rateMax));
    if (filters.kyc) params.set("kyc", "true");
    if (filters.languages?.length) params.set("languages", filters.languages.join(","));
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.fromDate) params.set("from", filters.fromDate);
    if (filters.toDate) params.set("to", filters.toDate);
    if (filters.page != null) params.set("page", String(filters.page));
    if (filters.size != null) params.set("size", String(filters.size));
    const qs = params.toString();
    // Backend sorts (promoted first) + paginates + returns the facet totals over the full set.
    const data = await apiGet<{
      items: SpecialistDto[];
      total: number;
      availableNow: number;
      availableWeek: number;
      rangeDays?: number | null;
      rangeUnavailable?: Record<string, number>;
    }>(`/api/specialists${qs ? `?${qs}` : ""}`, { locale: filters.locale });
    return {
      items: data.items.map(toSpecialist),
      total: data.total,
      availableNow: data.availableNow,
      availableWeek: data.availableWeek,
      rangeDays: data.rangeDays ?? null,
      rangeUnavailable: data.rangeUnavailable ?? {},
    };
  },

  /** Full profile for a single specialist (by user id). */
  async getById(id: string): Promise<SpecialistProfile> {
    const dto = await apiGet<SpecialistDto>(`/api/specialists/${encodeURIComponent(id)}`);
    const base: Specialist = {
      ...toSpecialist(dto, 0),
      // Detail endpoint provides the real specialization labels + language codes (the search
      // card DTO doesn't), so override the empty defaults from toSpecialist.
      specialties: (dto.specializations ?? []).map((s) => ({ label: s.label, count: 0 })),
      languages: dto.languages ?? [],
    };
    return {
      ...base,
      ...profileExtras(
        base,
        dto.completedJobs ?? 0,
        dto.memberSince ?? 0,
        dto.repeatClientsPct ?? 0,
        dto.certifications ?? [],
      ),
    };
  },

  /** The backend-defined filter schema (industries → specializations, availability, sort, ranges). */
  async getFilters(locale?: string): Promise<SearchFilterSchema> {
    return apiGet<SearchFilterSchema>("/api/specialists/filters", { locale });
  },
};

export type FilterOption = { code: string; label: string };
export type FilterRange = { min: number; max: number; defaultValue: number };

/** Backend-defined search filters; the frontend renders these (no hardcoded option lists). */
export type SearchFilterSchema = {
  industries: FilterOption[];
  specializations: Record<string, FilterOption[]>;
  availability: FilterOption[]; // codes: NOW/WEEK/DATE
  languages: FilterOption[]; // codes: pl/en/uk/de/ru
  sort: FilterOption[]; // codes: trust/distance/rate
  trust: FilterRange;
  distanceKm: FilterRange;
  rate: FilterRange;
  kyc: boolean;
};
