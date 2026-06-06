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

  /** Most searched (trending, last 24h). */
  async getTrending(): Promise<Trend[]> {
    // No backend endpoint yet — keep the mock.
    // TODO(backend): return apiGet("/api/catalog/trending");
    await mockDelay();
    return trending;
  },
};
