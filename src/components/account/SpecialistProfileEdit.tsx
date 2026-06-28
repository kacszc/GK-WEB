"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, Save } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/lib/ToastProvider";
import { requestErrorToast } from "@/lib/errorToast";
import { accountService, onboardingService, specialistsService, type SpecialistProfileUpdate } from "@/services";
import type { UserLocation } from "@/lib/types";
import { LocationPicker } from "@/components/search/LocationPicker";
import { AttributeFields, buildAttributePayload, type AttrVal } from "@/components/attributes/AttributeFields";
import { Chip, Field, fieldInput } from "@/components/onboarding/parts";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

const LANG_LEVELS = ["basic", "conversational", "advanced"] as const;

/**
 * Dedicated edit screen for a specialist's own profile — change name, headline, rate, location,
 * specializations, languages and catalog attributes without re-running the onboarding wizard.
 * Loads the current profile, sends the FULL state on save (upsert; nothing wiped), keeps publish state.
 */
export function SpecialistProfileEdit() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { show } = useToast();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["mySpecialistProfile", locale],
    queryFn: () => accountService.getMySpecialistProfile(locale),
  });
  const { data: industries = [] } = useQuery({ queryKey: ["industries"], queryFn: onboardingService.getIndustries });
  const { data: languages = [] } = useQuery({ queryKey: ["languages"], queryFn: onboardingService.getLanguages });

  // ---- editable state (seeded once from the loaded profile) ----
  const [seeded, setSeeded] = useState(false);
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [rate, setRate] = useState<number | undefined>(undefined);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [specs, setSpecs] = useState<string[]>([]);
  const [customs, setCustoms] = useState<{ industryCode: string; label: string }[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [langLevels, setLangLevels] = useState<Record<string, string>>({});
  const [attrValues, setAttrValues] = useState<Record<string, AttrVal>>({});
  const [openInd, setOpenInd] = useState<Set<string>>(new Set());
  // spec code → its industry, learned as industries expand (drives the attribute scope).
  const [specIndustry, setSpecIndustry] = useState<Record<string, string>>({});

  if (!seeded && profile) {
    setSeeded(true);
    setName(profile.displayName ?? "");
    setHeadline(profile.headline ?? "");
    setRate(profile.rateFrom || undefined);
    setSpecs(profile.specializationCodes ?? []);
    setCustoms(profile.customSpecializations ?? []);
    setLangs(profile.languages?.length ? profile.languages : ["pl"]);
    setLangLevels({ ...(profile.languageLevels ?? {}) });
    if (profile.district || (profile.lat && profile.lng)) {
      setLocation({ city: profile.district ?? "", label: profile.district ?? "", lat: profile.lat || 52.2297, lng: profile.lng || 21.0122 });
    }
    setOpenInd(new Set(profile.industryCodes ?? []));
    const av: Record<string, AttrVal> = {};
    for (const a of profile.attributes ?? []) {
      const cur = av[a.attributeCode] ?? {};
      if (a.optionCode) cur.options = [...(cur.options ?? []), a.optionCode];
      if (a.boolValue != null) cur.bool = a.boolValue;
      if (a.textValue != null) cur.text = a.textValue;
      if (a.dateValue != null) cur.date = a.dateValue;
      if (a.validUntil != null) cur.validUntil = a.validUntil;
      av[a.attributeCode] = cur;
    }
    setAttrValues(av);
  }

  // Industries in scope for attributes: those of selected specs (learned) + custom + the profile's
  // original set (fallback before any industry has expanded).
  const attrIndustries = Array.from(
    new Set([
      ...specs.map((c) => specIndustry[c]).filter(Boolean),
      ...customs.map((c) => c.industryCode),
      ...(profile?.industryCodes ?? []),
    ]),
  ) as string[];
  const { data: attrGroups = [] } = useQuery({
    queryKey: ["editAttrSchema", locale, [...attrIndustries].sort().join(","), [...specs].sort().join(",")],
    queryFn: () => specialistsService.getAttributeFilters(attrIndustries, specs, locale),
    enabled: attrIndustries.length > 0,
  });

  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const toggleInd = (code: string) =>
    setOpenInd((s) => {
      const n = new Set(s);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });

  const save = useMutation({
    mutationFn: () => {
      const payload: SpecialistProfileUpdate = {
        displayName: name.trim(),
        headline: headline.trim() || null,
        district: location?.district ?? location?.city ?? location?.label ?? null,
        lat: location?.lat,
        lng: location?.lng,
        rateFrom: rate,
        specializationCodes: specs,
        customSpecializations: customs,
        languageCodes: langs,
        languages: langs.map((code) => ({ code, level: langLevels[code] ?? null })),
        attributes: buildAttributePayload(attrGroups, attrValues),
      };
      return accountService.updateSpecialistProfile(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mySpecialistProfile"] });
      show({ title: t("editProfile.saved") });
      router.push("/account");
    },
    onError: (e) => show(requestErrorToast(e, t)),
  });

  if (isLoading) return <SkeletonCard className="h-[480px] border border-line-3" />;
  if (!profile) {
    // No profile yet → finish onboarding first (resume mode prefills what exists).
    return (
      <div className="rounded-panel border border-line-3 bg-surface p-6">
        <p className="text-[13px] text-ink-3">{t("account.detailsEmpty")}</p>
        <Button variant="dark" onClick={() => router.push("/onboarding/specialist?resume=1")} className="mt-3 rounded-tile px-4 py-2.5 text-sm">
          {t("account.detailsComplete")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("editProfile.title")}</h1>
        <p className="mt-1 text-[13px] text-ink-3">{t("editProfile.subtitle")}</p>
      </div>

      {/* Basics */}
      <section className="flex flex-col gap-4 rounded-panel border border-line-3 bg-surface p-6">
        <Field label={t("editProfile.name")}>
          <input value={name} onChange={(e) => setName(e.target.value)} className={fieldInput} />
        </Field>
        <Field label={t("editProfile.headline")}>
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder={t("editProfile.headlinePlaceholder")} className={fieldInput} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("editProfile.rate")}>
            <input
              type="number"
              inputMode="numeric"
              value={rate ?? ""}
              onChange={(e) => setRate(e.target.value === "" ? undefined : Number(e.target.value))}
              placeholder="np. 50"
              className={fieldInput}
            />
          </Field>
          <Field label={t("editProfile.location")}>
            <LocationPicker value={location} onLocate={setLocation} onClear={() => setLocation(null)} />
          </Field>
        </div>
      </section>

      {/* Specializations (industry → specs accordion) */}
      <section className="flex flex-col gap-3 rounded-panel border border-line-3 bg-surface p-6">
        <h2 className="text-[15px] font-semibold text-ink">{t("editProfile.specializations")}</h2>
        <div className="flex flex-col gap-2">
          {industries.map((ind) => {
            const expanded = openInd.has(ind.id);
            const customSel = customs.find((c) => c.industryCode === ind.id);
            return (
              <div key={ind.id} className="rounded-tile border border-line-3">
                <button
                  type="button"
                  onClick={() => toggleInd(ind.id)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-ink"
                >
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-3 transition-transform", !expanded && "-rotate-90")} />
                  <span className="flex-1">{ind.label}</span>
                </button>
                {expanded && (
                  <IndustrySpecs
                    industryId={ind.id}
                    selected={specs}
                    onToggleSpec={(code) => setSpecs((s) => toggle(s, code))}
                    onLearn={(map) => setSpecIndustry((m) => ({ ...m, ...map }))}
                    customLabel={customSel?.label ?? ""}
                    onCustom={(label) =>
                      setCustoms((cs) => {
                        const rest = cs.filter((c) => c.industryCode !== ind.id);
                        return label.trim() ? [...rest, { industryCode: ind.id, label: label.trim() }] : rest;
                      })
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Languages + proficiency */}
      <section className="flex flex-col gap-3 rounded-panel border border-line-3 bg-surface p-6">
        <h2 className="text-[15px] font-semibold text-ink">{t("editProfile.languages")}</h2>
        <div className="flex flex-wrap gap-2">
          {languages.map((l) => (
            <Chip key={l.code} label={l.name} selected={langs.includes(l.code)} onClick={() => setLangs((s) => toggle(s, l.code))} />
          ))}
        </div>
        {langs.length > 0 && (
          <div className="mt-1 flex flex-col gap-3">
            {langs.map((code) => {
              const nm = languages.find((l) => l.code === code)?.name ?? code;
              return (
                <div key={code} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                  <span className="text-[13px] font-medium text-ink-2">{nm}</span>
                  <div className="inline-flex rounded-tile border border-line-2 p-0.5">
                    {LANG_LEVELS.map((lvl) => {
                      const on = langLevels[code] === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setLangLevels((m) => ({ ...m, [code]: on ? "" : lvl }))}
                          className={cn("rounded-[7px] px-2.5 py-1 text-[12px] font-medium transition-colors", on ? "bg-ink text-on-dark" : "text-ink-3 hover:text-ink")}
                        >
                          {t(`onboarding.lvl_${lvl}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Catalog attributes (profession-driven) */}
      {attrGroups.length > 0 && (
        <section className="flex flex-col gap-3 rounded-panel border border-line-3 bg-surface p-6">
          <h2 className="text-[15px] font-semibold text-ink">{t("editProfile.details")}</h2>
          <AttributeFields groups={attrGroups} values={attrValues} setValues={setAttrValues} />
        </section>
      )}

      {/* Save bar */}
      <div className="sticky bottom-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/account")} className="rounded-tile px-4 py-2.5 text-sm">
          {t("editProfile.cancel")}
        </Button>
        <Button
          variant="dark"
          onClick={() => save.mutate()}
          disabled={save.isPending || !name.trim()}
          className="rounded-tile px-5 py-2.5 text-sm disabled:opacity-40"
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("editProfile.save")}
        </Button>
      </div>
    </div>
  );
}

/** Specializations of one industry (lazy-loaded when its row is expanded) + the "Inne" free-text. */
function IndustrySpecs({
  industryId,
  selected,
  onToggleSpec,
  onLearn,
  customLabel,
  onCustom,
}: {
  industryId: string;
  selected: string[];
  onToggleSpec: (code: string) => void;
  onLearn: (map: Record<string, string>) => void;
  customLabel: string;
  onCustom: (label: string) => void;
}) {
  const { t } = useI18n();
  const [learned, setLearned] = useState(false);
  const { data: options = [] } = useQuery({
    queryKey: ["specializations", industryId],
    queryFn: () => onboardingService.getSpecializations(industryId),
    enabled: !!industryId,
  });
  // Report spec→industry once so the parent can scope attributes correctly.
  if (!learned && options.length) {
    setLearned(true);
    onLearn(Object.fromEntries(options.map((o) => [o.code, industryId])));
  }
  return (
    <div className="flex flex-col gap-3 border-t border-line-3 px-3 py-3">
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <Chip key={o.code} label={o.label} check selected={selected.includes(o.code)} onClick={() => onToggleSpec(o.code)} />
        ))}
      </div>
      <input
        value={customLabel}
        onChange={(e) => onCustom(e.target.value)}
        placeholder={t("editProfile.otherPlaceholder")}
        className={`${fieldInput} text-[13px]`}
      />
    </div>
  );
}
