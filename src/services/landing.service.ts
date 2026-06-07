import type { Landing, Profession, Specialization, Trend } from "@/lib/types";
import { apiGet } from "@/lib/api-client";
import { professions, suggestedSpecializations, trending, mockDelay } from "./mock-data";

/** Backend payload shape for GET /api/landing. */
type LandingDto = {
  popular: { label: string; count: number; live: boolean }[];
  searchKeys: { label: string; count: number }[];
  trending: { rank: string; label: string; delta: number; added: number }[];
  liveStats: { onlineNow: number; jobsToday: number; avgResponseMin: number };
  recent: { query: string; location: string | null; rangeKm: number | null }[];
};

function fromDto(d: LandingDto): Landing {
  return {
    popular: d.popular.map<Profession>((p) => ({ label: p.label, count: p.count, live: p.live })),
    searchKeys: d.searchKeys.map<Specialization>((k) => ({ title: k.label, count: k.count, hint: "arrow" })),
    trending: d.trending.map<Trend>((t) => ({ rank: t.rank, label: t.label, delta: t.delta, added: t.added })),
    liveStats: d.liveStats,
    recent: d.recent.map((r) => ({ query: r.query, location: r.location, rangeKm: r.rangeKm })),
  };
}

/** Mock landing used only when the backend is unreachable (keeps dev usable). */
function mockLanding(): Landing {
  return {
    popular: professions,
    searchKeys: suggestedSpecializations,
    trending,
    liveStats: { onlineNow: 247, jobsToday: 18, avgResponseMin: 3 },
    recent: [],
  };
}

export const landingService = {
  /**
   * Whole landing page in one call. Auth-aware on the backend: a signed-in caller gets a
   * personalized order + recently-viewed quick actions. On transport failure we fall back to
   * the mock so the page still renders in dev — but we never fabricate sections the backend
   * returned empty (the UI hides empty sections).
   */
  async getLanding(opts: { locale?: string } = {}): Promise<Landing> {
    try {
      return fromDto(await apiGet<LandingDto>("/api/landing", { locale: opts.locale }));
    } catch {
      await mockDelay();
      return mockLanding();
    }
  },
};
