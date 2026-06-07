import type { SearchSuggestions, Specialization } from "@/lib/types";
import { apiGet } from "@/lib/api-client";

export const searchService = {
  /**
   * Search suggestions (autocomplete) from the profession catalog. There is no people-suggest
   * endpoint — the results page runs the real specialist search — so the people preview is empty.
   */
  async suggest(query: string): Promise<SearchSuggestions> {
    const dtos = await apiGet<{ code: string; label: string; count: number; live: boolean }[]>(
      `/api/search/suggest?q=${encodeURIComponent(query)}`,
    );
    const specializations: Specialization[] = dtos.map((d) => ({
      code: d.code,
      title: d.label,
      count: d.count,
      hint: "arrow",
    }));
    return {
      query,
      specializations,
      people: [],
      totalCount: specializations.reduce((sum, s) => sum + s.count, 0),
    };
  },
};
