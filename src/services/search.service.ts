import type { SearchSuggestions, Specialization } from "@/lib/types";
// import { apiGet } from "@/lib/api-client";
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
    // TODO(backend): return apiGet(`/search/suggest?q=${encodeURIComponent(query)}`);
    await mockDelay();

    const q = query.trim().toLowerCase();

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
