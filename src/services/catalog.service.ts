import type { Profession, Trend } from "@/lib/types";
// import { apiGet } from "@/lib/api-client";
import { professions, trending, mockDelay } from "./mock-data";

export const catalogService = {
  /** Popular professions ("one-click" chips). */
  async getPopularProfessions(): Promise<Profession[]> {
    // TODO(backend): return apiGet("/catalog/professions/popular");
    await mockDelay();
    return professions;
  },

  /** Most searched (trending, last 24h). */
  async getTrending(): Promise<Trend[]> {
    // TODO(backend): return apiGet("/catalog/trending");
    await mockDelay();
    return trending;
  },
};
