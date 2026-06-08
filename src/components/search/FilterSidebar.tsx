"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { specialistsService, type SpecialistFilters } from "@/services";
import type { Availability, UserLocation } from "@/lib/types";
import { LocationPicker } from "./LocationPicker";
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

export function FilterSidebar({
  filters,
  onPatch,
  onClear,
  userLocation,
  onLocate,
  onClearLocation,
  variant = "full",
}: Props) {
  const { t, locale } = useI18n();
  const [showMore, setShowMore] = useState(false);
  const [openIndustry, setOpenIndustry] = useState<string | null>(null);

  // The whole filter schema (options + bounds + localized labels) comes from the backend.
  const { data: schema } = useQuery({
    queryKey: ["searchFilters", locale],
    queryFn: () => specialistsService.getFilters(locale),
  });

  const toggle = <T,>(arr: T[] | undefined, value: T): T[] => {
    const set = new Set(arr ?? []);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    return [...set];
  };

  const professions = filters.professions ?? [];
  const industries = filters.industries ?? [];
  const specsOf = (industryCode: string) => schema?.specializations[industryCode] ?? [];
  const selectedCountIn = (industryCode: string) =>
    specsOf(industryCode).filter((s) => professions.includes(s.code)).length;

  // Which industry's specializations to show: user's open one, else one with picked specs.
  const industryOfFirstSelected =
    professions.length && schema
      ? Object.keys(schema.specializations).find((code) =>
          schema.specializations[code].some((s) => professions.includes(s.code)),
        )
      : undefined;
  const activeIndustry = openIndustry ?? industryOfFirstSelected ?? industries[0] ?? null;
  const specializations = activeIndustry ? specsOf(activeIndustry) : [];

  // Clicking an industry selects the WHOLE industry as a unit (no individual codes ticked) and
  // expands it for optional narrowing. Clicking again clears EVERYTHING for that industry —
  // both the whole-industry selection and any specific specializations picked within it.
  const toggleIndustry = (industryCode: string) => {
    const codes = specsOf(industryCode).map((s) => s.code);
    const anySelected = industries.includes(industryCode) || codes.some((c) => professions.includes(c));
    if (anySelected) {
      onPatch({
        industries: industries.filter((c) => c !== industryCode),
        professions: professions.filter((c) => !codes.includes(c)),
      });
    } else {
      onPatch({ industries: [...industries, industryCode] });
    }
    setOpenIndustry(industryCode);
  };

  const trust = schema?.trust ?? { min: 0, max: 100, defaultValue: 75 };
  const distance = schema?.distanceKm ?? { min: 1, max: 50, defaultValue: 25 };

  return (
    // Plain container so the whole page scrolls naturally (no wheel-trapping). The compact variant
    // lives inside the height-locked map layout, so it scrolls internally there.
    <div
      className={cn(
        "flex w-full flex-col gap-6 pb-6 text-sm",
        variant === "full" ? "self-start lg:sticky lg:top-20" : "h-full overflow-y-auto pr-1",
      )}
    >
      <LocationPicker value={userLocation} onLocate={onLocate} onClear={onClearLocation} />

      {/* Industry → specialization. Clicking an industry selects the whole industry; expand to
          refine by ticking/unticking individual specializations (across industries too). */}
      <Section title={t("results.fIndustry")}>
        <div className="flex flex-wrap gap-1.5">
          {schema?.industries.map((i) => {
            const n = selectedCountIn(i.code); // specific specs picked in this industry
            const whole = industries.includes(i.code);
            return (
              <Pill
                key={i.code}
                label={!whole && n > 0 ? `${i.label} · ${n}` : i.label}
                // "selected" reflects the actual selection only; being expanded is shown by the
                // specializations appearing below (a ring marks the open-but-unselected one).
                selected={whole || n > 0}
                ring={!whole && n === 0 && activeIndustry === i.code}
                onClick={() => toggleIndustry(i.code)}
              />
            );
          })}
        </div>

        {activeIndustry ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {specializations.map((s) => (
              <Pill
                key={s.code}
                label={s.label}
                small
                selected={professions.includes(s.code)}
                onClick={() => onPatch({ professions: toggle(professions, s.code) })}
              />
            ))}
            {/* "Inne" — matches specialists who registered a custom role in this industry. */}
            <Pill
              key="__other__"
              label={t("results.fOther")}
              small
              selected={(filters.customIndustries ?? []).includes(activeIndustry)}
              onClick={() => onPatch({ customIndustries: toggle(filters.customIndustries, activeIndustry) })}
            />
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-ink-4">{t("results.fPickIndustry")}</p>
        )}
      </Section>

      {/* Availability */}
      <Section title={t("results.fAvailability")}>
        {schema?.availability.map((a) => {
          const value = a.code.toLowerCase() as Availability;
          return (
            <CheckRow
              key={a.code}
              label={a.label}
              checked={filters.availability?.includes(value) ?? false}
              onChange={() => onPatch({ availability: toggle(filters.availability, value) })}
            />
          );
        })}
      </Section>

      {/* Distance */}
      <Section title={t("results.fDistance")}>
        <div className="text-[13px] font-bold text-ink">
          {t("filters.upTo", { km: filters.maxDistanceKm ?? distance.defaultValue })}
        </div>
        <input
          type="range"
          min={distance.min}
          max={distance.max}
          value={filters.maxDistanceKm ?? distance.defaultValue}
          onChange={(e) => onPatch({ maxDistanceKm: Number(e.target.value) })}
          className="mt-1 w-full cursor-pointer accent-brand-violet"
        />
      </Section>

      {/* Trust */}
      <Section title={t("results.fMinTrust")}>
        <div className="flex items-center justify-between text-[13px] font-bold text-success">
          <span>{filters.minTrust ?? trust.defaultValue}</span>
          <span className="text-ink-4">{t("results.fTo100")}</span>
        </div>
        <input
          type="range"
          min={trust.min}
          max={trust.max}
          value={filters.minTrust ?? trust.defaultValue}
          onChange={(e) => onPatch({ minTrust: Number(e.target.value) })}
          className="mt-1 w-full cursor-pointer accent-brand-violet"
        />
      </Section>

      {/* Advanced — collapsed by default to keep the panel light */}
      <div>
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-2 text-[12px] font-semibold text-ink-2 hover:text-ink"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {showMore ? t("results.fLess") : t("results.fMore")}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showMore && "rotate-180")} />
        </button>

        {showMore && (
          <div className="mt-4 flex flex-col gap-6">
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

            {schema?.kyc && (
              <Section title={t("results.fVerification")}>
                <CheckRow
                  label={t("results.fKyc")}
                  checked={filters.kyc ?? false}
                  onChange={() => onPatch({ kyc: !filters.kyc })}
                />
              </Section>
            )}

            {(schema?.languages.length ?? 0) > 0 && (
              <Section title={t("results.fLanguage")}>
                {schema?.languages.map((l) => (
                  <CheckRow
                    key={l.code}
                    label={l.label}
                    checked={filters.languages?.includes(l.code) ?? false}
                    onChange={() => onPatch({ languages: toggle(filters.languages, l.code) })}
                  />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onClear}
        className="self-start text-[13px] font-medium text-ink-3 hover:text-ink"
      >
        {t("results.clear")}
      </button>
    </div>
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

function Pill({
  label,
  selected,
  small,
  ring,
  onClick,
}: {
  label: string;
  selected: boolean;
  small?: boolean;
  ring?: boolean; // expanded-but-unselected hint (outline only)
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border font-medium transition-colors",
        small ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[12px]",
        selected
          ? "border-ink bg-ink text-on-dark"
          : ring
            ? "border-brand-violet text-ink"
            : "border-line-2 text-ink hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-brand-violet" />
      <span className="flex-1">{label}</span>
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
