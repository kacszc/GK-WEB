"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { Avatar } from "@/components/ui/Avatar";
import { LocationPicker } from "@/components/search/LocationPicker";
import { Chip, Field, fieldInput } from "@/components/onboarding/parts";
import { AiAssistCard } from "@/components/onboarding/AiAssistCard";
import { onboardingService, accountService, settingsService } from "@/services";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { experienceRanges } from "@/lib/types";
import type { ExperienceRange, SpecialistRateType, UserLocation } from "@/lib/types";

/** What the interview learned — the caller carries it into the resumed job search as filters. */
export type QuickInterviewResult = { professionCode?: string; industryCode?: string };

/**
 * The post-quick-register "mini interview" (modal-friendly, one compact screen): name, slim
 * profession picker (branża → zawód, both optional & clearable), experience bucket, city,
 * expected rate (monthly by default), phone. E-mail comes from the account; the avatar is
 * industry-themed until photo upload lands. Only the name is required — with a profession the
 * profile publishes (findable), without it it stays a draft the checklist finishes later.
 */
export function QuickInterviewForm({
  onDone,
  onSkip,
}: {
  onDone: (picked: QuickInterviewResult) => void;
  onSkip: () => void;
}) {
  const { t } = useI18n();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [spec, setSpec] = useState("");
  const [otherText, setOtherText] = useState(""); // "Inne" — custom role in the chosen industry
  const [expRange, setExpRange] = useState<ExperienceRange | null>(null);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [rate, setRate] = useState<number | undefined>(undefined);
  const [rateType, setRateType] = useState<SpecialistRateType>("monthly");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const { data: industries = [] } = useQuery({
    queryKey: ["industries"],
    queryFn: onboardingService.getIndustries,
  });
  const { data: specializations = [] } = useQuery({
    queryKey: ["specializations", industry],
    queryFn: () => onboardingService.getSpecializations(industry),
    enabled: !!industry,
  });

  // Only the name is required. A profession makes the profile publishable — but it's optional.
  const invalid = { name: !name.trim() };
  const hasErrors = invalid.name;

  async function save() {
    if (hasErrors) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setError(false);
    try {
      const specLabel = specializations.find((s) => s.code === spec)?.label ?? "";
      // Manual fallback: a role typed under "Inne" counts as a (custom) specialization,
      // scoped to the chosen industry — same rule as the full onboarding wizard.
      const custom = otherText.trim() && industry ? [{ industryCode: industry, label: otherText.trim() }] : [];
      await accountService.updateSpecialistProfile({
        displayName: name.trim(),
        headline: specLabel || custom[0]?.label || null,
        district: location?.district ?? location?.city ?? location?.label ?? null,
        lat: location?.lat,
        lng: location?.lng,
        rateFrom: rate,
        rateType,
        experienceRange: expRange ?? undefined,
        specializationCodes: spec ? [spec] : [],
        customSpecializations: custom,
        languageCodes: [],
        languages: [],
        // Publishable only with a specialization (catalog or custom) — without one the profile
        // stays a draft (the dashboard checklist picks it up) and a publish call would 422.
        publish: !!spec || custom.length > 0,
      });
      // Phone lives in account settings (consents module) — save it alongside when given.
      if (phone.trim()) {
        const current = await settingsService.get();
        await settingsService.update({ ...current, phone: phone.trim() });
      }
      onDone({ professionCode: spec || undefined, industryCode: industry || undefined });
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    // Field order is deliberate (stakeholder feedback): skills first — the user invests in
    // describing what they DO before handing over personal data (name/phone at the end).
    <div className="flex flex-col gap-3">
      {/* Assisted fill (oferteo-style "virtual assistant"): describe yourself in plain words,
          the backend extracts the fields below — the user reviews before saving. */}
      <AiAssistCard
        onDraft={(draft) => {
          if (draft.industry) setIndustry(draft.industry);
          if (draft.profession) setSpec(draft.profession);
          if (draft.experienceRange) setExpRange(draft.experienceRange);
          if (draft.rateFrom) setRate(draft.rateFrom);
          if (draft.rateType) setRateType(draft.rateType);
          return !!(draft.industry || draft.profession || draft.experienceRange || draft.rateFrom);
        }}
      />

      {/* Slim profession picker: branża → zawód, both searchable, optional and clearable (✕). */}
      <div className="grid grid-cols-2 gap-2.5">
        <Field label={t("hero.ivIndustry")}>
          <SearchSelect
            value={industry}
            onChange={(v) => {
              setIndustry(v);
              setSpec("");
            }}
            onClear={() => {
              setIndustry("");
              setSpec("");
            }}
            options={industries.map((i) => ({ value: i.id, label: i.label }))}
            placeholder={t("hero.ivPick")}
          />
        </Field>
        <Field label={t("hero.ivProfession")}>
          <SearchSelect
            value={spec}
            onChange={setSpec}
            onClear={() => setSpec("")}
            options={specializations.map((s) => ({ value: s.code, label: s.label }))}
            placeholder={industry ? t("hero.ivPick") : t("hero.ivPickIndustryFirst")}
          />
        </Field>
      </div>

      {/* Manual fallback when the catalog (or the assistant) has no matching role — same
          "Inne" free text as the full wizard; needs an industry to attach to. */}
      {industry && !spec && (
        <input
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          placeholder={t("onboarding.wOtherPlaceholder")}
          className={fieldInput}
        />
      )}

      <Field label={t("experience.question")}>
        <div className="flex flex-wrap gap-1.5">
          {experienceRanges.map((r) => (
            <Chip key={r} label={t(`experience.${r}`)} selected={expRange === r} onClick={() => setExpRange(expRange === r ? null : r)} />
          ))}
        </div>
      </Field>

      <Field label={t("hero.ivCity")}>
        <LocationPicker value={location} onLocate={setLocation} onClear={() => setLocation(null)} />
      </Field>

      <Field label={t("hero.ivRate")}>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            value={rate ?? ""}
            onChange={(e) => setRate(e.target.value === "" ? undefined : Number(e.target.value))}
            placeholder={rateType === "monthly" ? "6000" : "50"}
            className={cn(fieldInput, "min-w-0 flex-1")}
          />
          <div className="inline-flex shrink-0 rounded-tile border border-line-2 p-0.5">
            {(["monthly", "hourly"] as const).map((rt) => (
              <button
                key={rt}
                type="button"
                onClick={() => setRateType(rt)}
                className={cn(
                  "rounded-[7px] px-2 py-1 text-[11px] font-semibold transition-colors",
                  rateType === rt ? "bg-ink text-on-dark" : "text-ink-3 hover:text-ink",
                )}
              >
                {t(rt === "hourly" ? "hero.ivPerHour" : "hero.ivPerMonth")}
              </button>
            ))}
          </div>
        </div>
      </Field>

      {/* Personal data last — by the time the user gets here they're already invested. */}
      <div className="grid grid-cols-2 gap-2.5">
        <Field label={t("hero.ivName")}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("onboarding.wNamePlaceholder")}
            className={cn(fieldInput, showErrors && invalid.name && "border-[#e11d48]")}
          />
        </Field>
        <Field label={t("hero.ivPhone")}>
          <input
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+48"
            className={fieldInput}
          />
        </Field>
      </div>

      {/* Account e-mail (fixed) + the industry-themed avatar preview (photo upload comes later). */}
      <div className="flex items-center justify-between gap-3 rounded-tile bg-muted px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink">{user?.email}</p>
          <p className="text-[11px] text-ink-4">{t("hero.ivPhotoNote")}</p>
        </div>
        <Avatar name={name || "?"} industry={industry || undefined} size={40} />
      </div>

      {error && (
        <p className="text-[12px] text-[#b42318]" role="alert">
          {t("auth.errGeneric")}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-1 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-tile bg-ink py-3 text-sm font-bold text-on-dark transition-colors hover:bg-ink/90 disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("hero.ivSave")}
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="cursor-pointer text-center text-[13px] font-medium text-ink-4 transition-colors hover:text-ink"
      >
        {t("hero.ivSkip")}
      </button>
    </div>
  );
}
