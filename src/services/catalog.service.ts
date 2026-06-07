import type { Profession, Trend } from "@/lib/types";
import { apiGet } from "@/lib/api-client";
import { professions, trending, mockDelay } from "./mock-data";

/** Run `fn`, falling back to `fallback` if the backend is unreachable/errors. */
async function withFallback<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback();
  }
}

export const catalogService = {
  /** Popular professions ("one-click" chips). */
  async getPopularProfessions(): Promise<Profession[]> {
    return withFallback(
      () => apiGet<Profession[]>("/api/catalog/professions/popular"),
      async () => {
        await mockDelay();
        return professions;
      },
    );
  },

  /** Most in-demand professions (trending). */
  async getTrending(): Promise<Trend[]> {
    try {
      return await apiGet<Trend[]>("/api/catalog/trending");
    } catch {
      await mockDelay();
      return trending;
    }
  },
};
