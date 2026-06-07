import type { SearchSuggestions, Specialization } from "@/lib/types";
import { apiGet } from "@/lib/api-client";
import {
  suggestedSpecializations,
  peopleNearby,
  professions,
  mockDelay,
} from "./mock-data";

// Full specialization pool (suggested + derived from professions), de-duplicated.
const allSpecializations: Specialization[] = (() => {
  const fromProfessions: Specialization[] = professions.map((p) => ({
    title: p.label,
    count: p.count,
    hint: "arrow",
  }));
  const merged = [...suggestedSpecializations, ...fromProfessions];
  const seen = new Set<string>();
  return merged.filter((s) => {
    const key = s.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
})();

export const searchService = {
  /** Search suggestions (autocomplete). */
  async suggest(query: string): Promise<SearchSuggestions> {
    const q = query.trim().toLowerCase();

    // Real profession suggestions from the catalog; the people preview stays client-side
    // (there is no people-suggest endpoint — the results page runs the real specialist search).
    try {
      const dtos = await apiGet<{ code: string; label: string; count: number; live: boolean }[]>(
        `/api/search/suggest?q=${encodeURIComponent(query)}`,
      );
      const specializations: Specialization[] = dtos.map((d) => ({ code: d.code, title: d.label, count: d.count, hint: "arrow" }));
      const people = !q
        ? peopleNearby
        : peopleNearby.filter((p) => p.name.toLowerCase().includes(q) || p.meta.toLowerCase().includes(q));
      return { query, specializations, people, totalCount: specializations.reduce((sum, s) => sum + s.count, 0) };
    } catch {
      // Backend unavailable — fall back to the mock below.
    }

    await mockDelay();

    const specializations = !q
      ? suggestedSpecializations
      : allSpecializations
          .filter((s) => s.title.toLowerCase().includes(q))
          .slice(0, 6);

    const people = !q
      ? peopleNearby
      : peopleNearby.filter(
          (p) =>
            p.name.toLowerCase().includes(q) || p.meta.toLowerCase().includes(q),
        );

    const totalCount = specializations.reduce((sum, s) => sum + s.count, 0);

    return { query, specializations, people, totalCount };
  },
};
