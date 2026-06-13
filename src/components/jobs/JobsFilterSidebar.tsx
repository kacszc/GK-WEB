"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/i18n/I18nProvider";
import { specialistsService, type JobFilters } from "@/services";
import type { UserLocation, JobDuration } from "@/lib/types";
import { LocationPicker } from "@/components/search/LocationPicker";
import { WhenFilter, isoToWhen, whenToISO } from "@/components/landing/WhenFilter";
import { cn } from "@/lib/cn";

const DURATIONS: JobDuration[] = ["long_term", "few_weeks", "few_days", "one_day"];

type Props = {
  filters: JobFilters;
  onPatch: (patch: Partial<JobFilters>) => void;
  onClear: () => void;
  userLocation: UserLocation | null;
  onLocate: (loc: UserLocation) => void;
  onClearLocation: () => void;
  variant?: "full" | "compact";
};

/** Job-browse filters: industry → specialization (+ Inne), length, min rate, location. */
export function JobsFilterSidebar({
  filters,
  onPatch,
  onClear,
  userLocation,
  onLocate,
  onClearLocation,
  variant = "full",
}: Props) {
  const { t, locale } = useI18n();
  const [openIndustry, setOpenIndustry] = useState<string | null>(null);

  // Reuse the catalog-driven schema (industries → specializations) from the specialist search.
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
  const customIndustries = filters.customIndustries ?? [];
  const durations = filters.durations ?? [];
  const specsOf = (code: string) => schema?.specializations[code] ?? [];
  const countIn = (code: string) => specsOf(code).filter((s) => professions.includes(s.code)).length;

  const industryOfFirstSelected =
    professions.length && schema
      ? Object.keys(schema.specializations).find((c) => schema.specializations[c].some((s) => professions.includes(s.code)))
      : undefined;
  const activeIndustry = openIndustry ?? industryOfFirstSelected ?? customIndustries[0] ?? industries[0] ?? null;
  const specializations = activeIndustry ? specsOf(activeIndustry) : [];

  const toggleIndustry = (code: string) => {
    const codes = specsOf(code).map((s) => s.code);
    const any = industries.includes(code) || codes.some((c) => professions.includes(c)) || customIndustries.includes(code);
    if (any) {
      onPatch({
        industries: industries.filter((c) => c !== code),
        professions: professions.filter((c) => !codes.includes(c)),
        customIndustries: customIndustries.filter((c) => c !== code),
      });
    } else {
      onPatch({ industries: [...industries, code] });
    }
    setOpenIndustry(code);
  };

  const distance = schema?.distanceKm ?? { min: 1, max: 50, defaultValue: 25 };

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-6 pb-6 text-sm",
        variant === "full" ? "self-start lg:sticky lg:top-20" : "h-full overflow-y-auto pr-1",
      )}
    >
      <LocationPicker value={userLocation} onLocate={onLocate} onClear={onClearLocation} />

      {/* When — date/range; the backend keeps only jobs whose work date(s) overlap it. */}
      <Section title={t("filters.when")}>
        <WhenFilter
          fullWidth
          align="start"
          value={isoToWhen(filters.fromDate, filters.toDate)}
          onChange={(v) => onPatch(whenToISO(v))}
        />
      </Section>

      <Section title={t("results.fIndustry")}>
        <div className="flex flex-wrap gap-1.5">
          {schema?.industries.map((i) => {
            const whole = industries.includes(i.code);
            const customSel = customIndustries.includes(i.code);
            const narrowed = countIn(i.code) + (customSel ? 1 : 0);
            return (
              <Pill
                key={i.code}
                label={!whole && narrowed > 0 ? `${i.label} · ${narrowed}` : i.label}
                selected={whole || narrowed > 0}
                ring={!whole && narrowed === 0 && activeIndustry === i.code}
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
                onClick={() =>
                  onPatch({
                    professions: toggle(professions, s.code),
                    industries: industries.filter((c) => c !== activeIndustry),
                  })
                }
              />
            ))}
            <Pill
              label={t("results.fOther")}
              small
              selected={customIndustries.includes(activeIndustry)}
              onClick={() =>
                onPatch({
                  customIndustries: toggle(customIndustries, activeIndustry),
                  industries: industries.filter((c) => c !== activeIndustry),
                })
              }
            />
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-ink-4">{t("results.fPickIndustry")}</p>
        )}
      </Section>

      <Section title={t("postJob.sWhen")}>
        <div className="flex flex-wrap gap-1.5">
          {DURATIONS.map((d) => (
            <Pill
              key={d}
              label={t(`postJob.dur.${d}`)}
              small
              selected={durations.includes(d)}
              onClick={() => onPatch({ durations: toggle(durations, d) })}
            />
          ))}
        </div>
      </Section>

      <Section title={t("jobs.fMinRate")}>
        <input
          type="number"
          inputMode="numeric"
          placeholder={t("postJob.ratePlaceholder")}
          value={filters.rateMin ?? ""}
          onChange={(e) => onPatch({ rateMin: e.target.value === "" ? undefined : Number(e.target.value) })}
          className="w-full rounded-tile border border-line-2 bg-surface px-2.5 py-1.5 text-[13px] text-ink outline-none transition-colors focus:border-ink placeholder:text-ink-4"
        />
      </Section>

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
  ring?: boolean;
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
