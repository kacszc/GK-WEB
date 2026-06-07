"use client";

import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/i18n/I18nProvider";
import { specialistsService, type SpecialistFilters } from "@/services";
import type { Availability } from "@/lib/types";

const AVAIL_KEY: Record<Availability, string> = {
  now: "results.fAvailNow",
  week: "results.fAvailWeek",
  date: "results.fAvailDate",
};
const LANG_KEY: Record<string, string> = {
  pl: "results.langPl",
  en: "results.langEn",
  uk: "results.langUk",
  de: "results.langDe",
  ru: "results.langRu",
};

export function ActiveFilters({
  filters,
  onPatch,
}: {
  filters: SpecialistFilters;
  onPatch: (patch: Partial<SpecialistFilters>) => void;
}) {
  const { t, locale } = useI18n();
  // Reuses the sidebar's cached schema (same query key) to label the profession chip.
  const { data: schema } = useQuery({
    queryKey: ["searchFilters", locale],
    queryFn: () => specialistsService.getFilters(locale),
  });
  const chips: { key: string; label: string; remove: () => void }[] = [];

  if (filters.q) chips.push({ key: "q", label: filters.q, remove: () => onPatch({ q: undefined }) });
  if (filters.profession) {
    const label =
      (schema && Object.values(schema.specializations).flat().find((s) => s.code === filters.profession)?.label) ||
      filters.profession;
    chips.push({ key: "prof", label, remove: () => onPatch({ profession: undefined }) });
  }
  if (filters.minTrust)
    chips.push({ key: "trust", label: `Trust ≥ ${filters.minTrust}`, remove: () => onPatch({ minTrust: 0 }) });
  if (filters.maxDistanceKm != null)
    chips.push({
      key: "dist",
      label: t("filters.upTo", { km: filters.maxDistanceKm }),
      remove: () => onPatch({ maxDistanceKm: undefined }),
    });
  for (const a of filters.availability ?? [])
    chips.push({
      key: `av-${a}`,
      label: t(AVAIL_KEY[a]),
      remove: () => onPatch({ availability: (filters.availability ?? []).filter((x) => x !== a) }),
    });
  for (const sp of filters.specialties ?? [])
    chips.push({
      key: `sp-${sp}`,
      label: sp,
      remove: () => onPatch({ specialties: (filters.specialties ?? []).filter((x) => x !== sp) }),
    });
  if (filters.kyc) chips.push({ key: "kyc", label: t("results.fKyc"), remove: () => onPatch({ kyc: false }) });
  for (const l of filters.languages ?? [])
    chips.push({
      key: `lng-${l}`,
      label: t(LANG_KEY[l] ?? l),
      remove: () => onPatch({ languages: (filters.languages ?? []).filter((x) => x !== l) }),
    });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={c.remove}
          className="inline-flex items-center gap-1.5 rounded-full border border-line-2 bg-surface px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-muted cursor-pointer"
        >
          {c.label}
          <X className="h-3.5 w-3.5 text-ink-4" />
        </button>
      ))}
    </div>
  );
}
