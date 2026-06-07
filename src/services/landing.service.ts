import type { Landing, Profession, Specialization, Trend } from "@/lib/types";
import { apiGet } from "@/lib/api-client";

/** Backend payload shape for GET /api/landing. */
type LandingDto = {
  popular: { code: string; label: string; count: number; live: boolean }[];
  searchKeys: { code: string; label: string; count: number }[];
  trending: { rank: string; code: string; label: string; delta: number; added: number }[];
  liveStats: { onlineNow: number; jobsToday: number; avgResponseMin: number };
  recent: { query: string; location: string | null; rangeKm: number | null }[];
};

function fromDto(d: LandingDto): Landing {
  return {
    popular: d.popular.map<Profession>((p) => ({ code: p.code, label: p.label, count: p.count, live: p.live })),
    searchKeys: d.searchKeys.map<Specialization>((k) => ({ code: k.code, title: k.label, count: k.count, hint: "arrow" })),
    trending: d.trending.map<Trend>((t) => ({ rank: t.rank, code: t.code, label: t.label, delta: t.delta, added: t.added })),
    liveStats: d.liveStats,
    recent: d.recent.map((r) => ({ query: r.query, location: r.location, rangeKm: r.rangeKm })),
  };
}

export const landingService = {
  /**
   * Whole landing page in one backend call. Auth-aware: a signed-in caller gets a personalized
   * order + recently-viewed quick actions. Empty sections are hidden by the UI.
   */
  async getLanding(opts: { locale?: string } = {}): Promise<Landing> {
    return fromDto(await apiGet<LandingDto>("/api/landing", { locale: opts.locale }));
  },
};
