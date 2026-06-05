"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { jobsService, type JobFilters } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";

/** Cached job-postings search (job-seeker side). */
export function useJobSearch(filters: JobFilters) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ["jobs", { ...filters, locale }],
    queryFn: () => jobsService.searchJobs({ ...filters, locale }),
    placeholderData: keepPreviousData,
  });
}
