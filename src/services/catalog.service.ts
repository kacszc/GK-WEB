import type { Profession, Trend } from "@/lib/types";
import { apiGet } from "@/lib/api-client";

export const catalogService = {
  /** Popular professions ("one-click" chips). */
  async getPopularProfessions(): Promise<Profession[]> {
    return apiGet<Profession[]>("/api/catalog/professions/popular");
  },

  /** Most in-demand professions (trending). */
  async getTrending(): Promise<Trend[]> {
    return apiGet<Trend[]>("/api/catalog/trending");
  },
};
