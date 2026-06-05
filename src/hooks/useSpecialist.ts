"use client";

import { useQuery } from "@tanstack/react-query";
import { specialistsService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";

/** Cached single specialist profile. */
export function useSpecialist(id: string) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ["specialist", id, locale],
    queryFn: () => specialistsService.getById(id),
  });
}
