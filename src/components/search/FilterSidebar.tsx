"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { specialistsService, type SpecialistFilters } from "@/services";
import type { Availability, UserLocation, AttributeDef } from "@/lib/types";
import { LocationPicker } from "./LocationPicker";
import { WhenFilter, isoToWhen, whenToISO } from "@/components/landing/WhenFilter";
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
  const activeIndustry =
    openIndustry ?? industryOfFirstSelected ?? (filters.customIndustries ?? [])[0] ?? industries[0] ?? null;
  const specializations = activeIndustry ? specsOf(activeIndustry) : [];

  // Clicking an industry selects the WHOLE industry as a unit (no individual codes ticked) and
  // expands it for optional narrowing. Clicking again clears EVERYTHING for that industry —
  // both the whole-industry selection and any specific specializations picked within it.
  const customIndustries = filters.customIndustries ?? [];
  const toggleIndustry = (industryCode: string) => {
    const codes = specsOf(industryCode).map((s) => s.code);
    const anySelected =
      industries.includes(industryCode) ||
      codes.some((c) => professions.includes(c)) ||
      customIndustries.includes(industryCode);
    if (anySelected) {
      // Re-click clears EVERYTHING for that industry: whole-industry, specific specs, and "Inne".
      onPatch({
        industries: industries.filter((c) => c !== industryCode),
        professions: professions.filter((c) => !codes.includes(c)),
        customIndustries: customIndustries.filter((c) => c !== industryCode),
      });
    } else {
      onPatch({ industries: [...industries, industryCode] });
    }
    setOpenIndustry(industryCode);
  };

  // Catalog-attribute filters, scoped to the chosen branże/specjalizacje (so gastronomy filters
  // don't show for a construction search). Industries come from whole-industry picks, "Inne", and
  // the industries the picked specializations belong to. Backend returns only in-scope attributes.
  const attrIndustries = Array.from(
    new Set([
      ...industries,
      ...customIndustries,
      ...(schema
        ? Object.keys(schema.specializations).filter((code) =>
            schema.specializations[code].some((s) => professions.includes(s.code)),
          )
        : []),
    ]),
  );
  const hasAttrScope = attrIndustries.length > 0 || professions.length > 0;
  const { data: attrGroups } = useQuery({
    queryKey: ["searchAttrFilters", locale, [...attrIndustries].sort().join(","), [...professions].sort().join(",")],
    queryFn: () => specialistsService.getAttributeFilters(attrIndustries, professions, locale),
    enabled: hasAttrScope,
  });

  // Only SELECT/BOOL attributes are filterable (DATE/TEXT can't map to a token).
  const FILTERABLE = new Set(["SINGLE_SELECT", "MULTI_SELECT", "BOOL", "BOOL_EXPIRY"]);
  const filterableGroups = (attrGroups ?? [])
    .map((g) => ({ ...g, attributes: g.attributes.filter((a) => FILTERABLE.has(a.type)) }))
    .filter((g) => g.attributes.length > 0);
  const attrTokens = filters.attributes ?? [];
  const toggleAttr = (token: string) => onPatch({ attributes: toggle(attrTokens, token) });

  const distance = schema?.distanceKm ?? { min: 1, max: 50, defaultValue: 25 };
  // Selected pay model for the rate filter (variant A); defaults to hourly for display.
  const ratePeriod = filters.rateType ?? "hourly";

  return (
    // Plain container so the whole page scrolls naturally (no wheel-trapping). The compact variant
    // lives inside the height-locked map layout, so it scrolls internally there.
    <div
      className={cn(
        "flex w-full flex-col gap-6 pb-6 text-sm",
        variant === "full" ? "self-start lg:sticky lg:top-20" : "h-full overflow-y-auto pr-1",
      )}
    >
      <LocationPicker
        value={userLocation}
        onLocate={onLocate}
        onClear={onClearLocation}
        radiusKm={filters.maxDistanceKm}
        onRadiusChange={(km) => onPatch({ maxDistanceKm: km })}
        radiusBounds={distance}
      />

      {/* Industry → specialization. Clicking an industry selects the whole industry; expand to
          refine by ticking/unticking individual specializations (across industries too). */}
      <Section title={t("results.fIndustry")}>
        <div className="flex flex-wrap gap-1.5">
          {schema?.industries.map((i) => {
            const n = selectedCountIn(i.code); // specific specs picked in this industry
            const whole = industries.includes(i.code);
            const customSel = customIndustries.includes(i.code); // "Inne" picked for this industry
            const narrowed = n + (customSel ? 1 : 0); // specific sub-selections (specs + "Inne")
            return (
              <Pill
                key={i.code}
                label={!whole && narrowed > 0 ? `${i.label} · ${narrowed}` : i.label}
                // "selected" reflects the actual selection only; being expanded is shown by the
                // specializations appearing below (a ring marks the open-but-unselected one).
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
                // Picking a specific specialization narrows away from the whole-industry selection
                // (branża bez podbranży = wszystko; konkretna podbranża = tylko ona).
                onClick={() =>
                  onPatch({
                    professions: toggle(professions, s.code),
                    industries: industries.filter((c) => c !== activeIndustry),
                  })
                }
              />
            ))}
            {/* "Inne" — matches specialists with a custom role in this industry; also narrows. */}
            <Pill
              key="__other__"
              label={t("results.fOther")}
              small
              selected={(filters.customIndustries ?? []).includes(activeIndustry)}
              onClick={() =>
                onPatch({
                  customIndustries: toggle(filters.customIndustries, activeIndustry),
                  industries: industries.filter((c) => c !== activeIndustry),
                })
              }
            />
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-ink-4">{t("results.fPickIndustry")}</p>
        )}
      </Section>

      {/* Dostępność — one block: the self-declared status filter + the "when" term you need someone
          for. The "when" never excludes; it only badges each specialist as busy/unavailable for it. */}
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
        <div className="mt-3">
          <p className="mb-1.5 text-[12px] font-medium text-ink-2">{t("filters.when")}</p>
          <WhenFilter
            fullWidth
            align="start"
            value={isoToWhen(filters.fromDate, filters.toDate)}
            onChange={(v) => onPatch(whenToISO(v))}
          />
        </div>
      </Section>

      {/* Stawka (variant A): pick the pay model, then a from–to range within that period so hourly and
          monthly amounts never mix. The period only constrains results once an amount is entered. */}
      <Section title={t("results.fRate")}>
        <div className="mb-2 inline-flex w-fit self-start rounded-tile border border-line-2 p-0.5">
          {(["monthly", "hourly"] as const).map((rt) => (
            <button
              key={rt}
              type="button"
              onClick={() => onPatch({ rateType: rt })}
              className={cn(
                "rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition-colors",
                ratePeriod === rt ? "bg-ink text-on-dark" : "text-ink-3 hover:text-ink",
              )}
            >
              {t(`filters.ratePeriod.${rt}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <RateInput
            placeholder={`${t("results.fFrom")} ${ratePeriod === "monthly" ? 3000 : 25}`}
            value={filters.rateMin}
            onChange={(v) => onPatch({ rateMin: v })}
          />
          <RateInput
            placeholder={`${t("results.fTo")} ${ratePeriod === "monthly" ? 9000 : 80}`}
            value={filters.rateMax}
            onChange={(v) => onPatch({ rateMax: v })}
          />
        </div>
      </Section>

      {/* Trust Score & reliability are internal-only (hidden from users) — no score sliders here. */}

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
            {/* Catalog attributes (profession-driven): shown only once a branża/specjalizacja is picked,
                so the relevant filters (doświadczenie, uprawnienia, języki obce) appear in context. */}
            {hasAttrScope &&
              filterableGroups.map((g) => (
                <Section key={g.code} title={g.label}>
                  <div className="flex flex-col gap-3">
                    {g.attributes.map((a) => (
                      <AttributeFilter key={a.code} attr={a} selected={attrTokens} onToggle={toggleAttr} />
                    ))}
                  </div>
                </Section>
              ))}

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

/** One catalog attribute as a filter control. BOOL/BOOL_EXPIRY → a single check (token = `code`);
 * SELECT types → option pills (token = `code:option`). Multiple options of one attribute are OR'd
 * by the backend, so they can be freely combined. */
function AttributeFilter({
  attr,
  selected,
  onToggle,
}: {
  attr: AttributeDef;
  selected: string[];
  onToggle: (token: string) => void;
}) {
  if (attr.type === "BOOL" || attr.type === "BOOL_EXPIRY") {
    return (
      <CheckRow
        label={attr.label}
        checked={selected.includes(attr.code)}
        onChange={() => onToggle(attr.code)}
      />
    );
  }
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-medium text-ink-2" title={attr.help ?? undefined}>
        {attr.label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {attr.options.map((o) => {
          const token = `${attr.code}:${o.code}`;
          return (
            <Pill
              key={o.code}
              label={o.label}
              small
              selected={selected.includes(token)}
              onClick={() => onToggle(token)}
            />
          );
        })}
      </div>
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
