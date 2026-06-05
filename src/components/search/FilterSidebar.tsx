"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { specialistFacets, type SpecialistFilters } from "@/services";
import type { Availability, UserLocation } from "@/lib/types";
import { LocationButton } from "./LocationButton";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { cn } from "@/lib/cn";

type Props = {
  filters: SpecialistFilters;
  onPatch: (patch: Partial<SpecialistFilters>) => void;
  onClear: () => void;
  userLocation: UserLocation | null;
  onLocate: (loc: UserLocation) => void;
  onClearLocation: () => void;
  variant?: "full" | "compact";
};

const AVAILABILITY: { id: Availability; key: string }[] = [
  { id: "now", key: "results.fAvailNow" },
  { id: "week", key: "results.fAvailWeek" },
  { id: "date", key: "results.fAvailDate" },
];

const LANGS: { code: string; key: string }[] = [
  { code: "pl", key: "results.langPl" },
  { code: "en", key: "results.langEn" },
  { code: "uk", key: "results.langUk" },
  { code: "de", key: "results.langDe" },
  { code: "ru", key: "results.langRu" },
];

export function FilterSidebar({
  filters,
  onPatch,
  onClear,
  userLocation,
  onLocate,
  onClearLocation,
  variant = "full",
}: Props) {
  const { t } = useI18n();
  const [showAllSpec, setShowAllSpec] = useState(false);

  const toggle = <T,>(arr: T[] | undefined, value: T): T[] => {
    const set = new Set(arr ?? []);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    return [...set];
  };

  const specEntries = Object.entries(specialistFacets.specialties).sort((a, b) => b[1] - a[1]);
  const visibleSpec = showAllSpec ? specEntries : specEntries.slice(0, 4);

  return (
    <ScrollArea
      className={cn(variant === "full" ? "self-start lg:sticky lg:top-20" : "h-full")}
      contentClassName={cn(
        "flex w-full flex-col gap-6 pb-12 pr-3 text-sm",
        variant === "full" ? "lg:max-h-[calc(100vh-6rem)]" : "h-full",
      )}
    >
      <LocationButton value={userLocation} onLocate={onLocate} onClear={onClearLocation} />

      {/* Trust score */}
      <Section title={t(variant === "full" ? "results.fMinTrust" : "results.fMinTrust")}>
        <div className="flex items-center justify-between text-[13px] font-bold text-success">
          <span>{filters.minTrust ?? 0}</span>
          <span className="text-ink-4">{t("results.fTo100")}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={filters.minTrust ?? 0}
          onChange={(e) => onPatch({ minTrust: Number(e.target.value) })}
          className="mt-1 w-full cursor-pointer accent-brand-violet"
        />
      </Section>

      {/* Distance */}
      <Section title={t("results.fDistance")}>
        <div className="text-[13px] font-bold text-ink">{t("filters.upTo", { km: filters.maxDistanceKm ?? 25 })}</div>
        <input
          type="range"
          min={1}
          max={50}
          value={filters.maxDistanceKm ?? 25}
          onChange={(e) => onPatch({ maxDistanceKm: Number(e.target.value) })}
          className="mt-1 w-full cursor-pointer accent-brand-violet"
        />
      </Section>

      {/* Availability */}
      <Section title={t("results.fAvailability")}>
        {AVAILABILITY.map((a) => (
          <CheckRow
            key={a.id}
            label={t(a.key)}
            count={specialistFacets.availability[a.id]}
            checked={filters.availability?.includes(a.id) ?? false}
            onChange={() => onPatch({ availability: toggle(filters.availability, a.id) })}
          />
        ))}
      </Section>

      {/* Specialization */}
      <Section title={t("results.fSpecialization")}>
        {visibleSpec.map(([label, count]) => (
          <CheckRow
            key={label}
            label={label}
            count={count}
            checked={filters.specialties?.includes(label) ?? false}
            onChange={() => onPatch({ specialties: toggle(filters.specialties, label) })}
          />
        ))}
        {specEntries.length > 4 && (
          <button
            type="button"
            onClick={() => setShowAllSpec((v) => !v)}
            className="mt-1 text-[12px] font-medium text-brand-violet hover:underline"
          >
            {t("results.fShowMore")}
          </button>
        )}
      </Section>

      {/* Hourly rate */}
      <Section title={t("results.fRate")}>
        <div className="flex items-center gap-2">
          <RateInput
            placeholder={`${t("results.fFrom")} 25`}
            value={filters.rateMin}
            onChange={(v) => onPatch({ rateMin: v })}
          />
          <RateInput
            placeholder={`${t("results.fTo")} 80`}
            value={filters.rateMax}
            onChange={(v) => onPatch({ rateMax: v })}
          />
        </div>
      </Section>

      {variant === "full" && (
        <Section title={t("results.fVerification")}>
          <CheckRow
            label={t("results.fKyc")}
            count={specialistFacets.kyc}
            checked={filters.kyc ?? false}
            onChange={() => onPatch({ kyc: !filters.kyc })}
          />
        </Section>
      )}

      {/* Language */}
      <Section title={t("results.fLanguage")}>
        {LANGS.map((l) => (
          <CheckRow
            key={l.code}
            label={t(l.key)}
            count={specialistFacets.languages[l.code] ?? 0}
            checked={filters.languages?.includes(l.code) ?? false}
            onChange={() => onPatch({ languages: toggle(filters.languages, l.code) })}
          />
        ))}
      </Section>

      <button
        type="button"
        onClick={onClear}
        className="self-start text-[13px] font-medium text-ink-3 hover:text-ink"
      >
        {t("results.clear")}
      </button>
    </ScrollArea>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-bold tracking-[0.5px] text-ink-3">{title}</h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-brand-violet" />
      <span className="flex-1">{label}</span>
      {count != null && <span className="text-[11px] text-ink-4">{count}</span>}
    </label>
  );
}

function RateInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      className={cn(
        "w-full rounded-tile border border-line-2 bg-surface px-2.5 py-1.5 text-[13px] text-ink",
        "outline-none transition-colors focus:border-ink placeholder:text-ink-4",
      )}
    />
  );
}
