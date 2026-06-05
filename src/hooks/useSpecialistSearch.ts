"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { specialistsService, type SpecialistFilters } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Cached specialist search. The query key includes the filters + locale, so the
 * same search is served from cache (e.g. when switching List/Map views) and
 * refetched only when filters change. Swaps to the HTTP backend transparently.
 */
export function useSpecialistSearch(filters: SpecialistFilters) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ["specialists", { ...filters, locale }],
    queryFn: () => specialistsService.search({ ...filters, locale }),
    placeholderData: keepPreviousData, // keep previous results while refetching
  });
}
