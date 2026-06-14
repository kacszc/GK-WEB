import type { SpecialistFilters, SpecialistSort } from "@/services";
import type { Availability, UserLocation } from "@/lib/types";
import type { ResultsView } from "./ResultsToolbar";

// Single source of truth for the /search URL <-> filter mapping. The server page parses the
// incoming query (SSR-safe, restores on reload/share); the client writes it back on change.

const DEFAULT_TRUST = 75;
const DEFAULT_AVAILABILITY: Availability[] = ["now", "week"];
const DEFAULT_SORT: SpecialistSort = "trust";

export type SearchParamsInput = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);
const csv = (v: string | undefined): string[] | undefined =>
  v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
const numOr = (v: string | undefined, fallback: number): number => {
  const n = v != null ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};
const numOrUndef = (v: string | undefined): number | undefined => {
  const n = v != null ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const asView = (v: string | undefined): ResultsView | undefined =>
  v === "list" || v === "map" || v === "mapList" ? v : undefined;

/** Parse the query string into filters + view (defaults applied when a param is absent). */
export function parseSearchFilters(sp: SearchParamsInput): { filters: SpecialistFilters; view: ResultsView } {
  const professions = csv(first(sp.professions)) ?? (first(sp.profession) ? [first(sp.profession)!] : undefined);
  const availabilityRaw = first(sp.availability);
  const kyc = first(sp.kyc);
  const filters: SpecialistFilters = {
    q: first(sp.q) || undefined,
    professions,
    industries: csv(first(sp.industries)),
    customIndustries: csv(first(sp.customIndustries)),
    minTrust: numOr(first(sp.minTrust), DEFAULT_TRUST),
    // Reliability is an opt-in cut: 0 / absent means "any" (don't reduce results unexpectedly).
    minReliability: numOrUndef(first(sp.minReliability)),
    // No distance cap by default → "Proponowane" (everyone). A limit applies only once the user sets it.
    maxDistanceKm: numOrUndef(first(sp.maxDistanceKm)),
    // Present (even empty) → user-controlled; absent → default. Lets the user clear it explicitly.
    availability: availabilityRaw != null ? ((csv(availabilityRaw) ?? []) as Availability[]) : DEFAULT_AVAILABILITY,
    rateMin: numOrUndef(first(sp.rateMin)),
    rateMax: numOrUndef(first(sp.rateMax)),
    kyc: kyc === "1" || kyc === "true",
    languages: csv(first(sp.languages)),
    sort: (first(sp.sort) as SpecialistSort) || DEFAULT_SORT,
    fromDate: first(sp.from) || undefined,
    toDate: first(sp.to) || undefined,
  };
  return { filters, view: asView(first(sp.view)) ?? "list" };
}

/** Parse a search-origin city from the URL (lat/lng[/city][/code]) — carried from the landing search.
 * Returns null when no point is given (→ "Proponowane": no anchor, everyone). */
export function parseLocation(sp: SearchParamsInput): UserLocation | null {
  const lat = numOrUndef(first(sp.lat));
  const lng = numOrUndef(first(sp.lng));
  if (lat == null || lng == null) return null;
  const city = first(sp.city);
  return { lat, lng, city, code: first(sp.code), label: city ?? "" };
}

/** Serialize filters + view back into a query string (omits empty/default-ish values). */
export function serializeSearchFilters(f: SpecialistFilters, view: ResultsView): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.professions?.length) p.set("professions", f.professions.join(","));
  if (f.industries?.length) p.set("industries", f.industries.join(","));
  if (f.customIndustries?.length) p.set("customIndustries", f.customIndustries.join(","));
  p.set("availability", (f.availability ?? []).join(",")); // always present to preserve "cleared"
  if (f.minTrust != null) p.set("minTrust", String(f.minTrust));
  if (f.minReliability != null && f.minReliability > 0) p.set("minReliability", String(f.minReliability));
  if (f.maxDistanceKm != null) p.set("maxDistanceKm", String(f.maxDistanceKm));
  if (f.rateMin != null) p.set("rateMin", String(f.rateMin));
  if (f.rateMax != null) p.set("rateMax", String(f.rateMax));
  if (f.kyc) p.set("kyc", "1");
  if (f.languages?.length) p.set("languages", f.languages.join(","));
  if (f.sort) p.set("sort", f.sort);
  if (f.fromDate) p.set("from", f.fromDate);
  if (f.toDate) p.set("to", f.toDate);
  if (view !== "list") p.set("view", view);
  return p.toString();
}
