"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MailCheck, Loader2, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { LocationPicker } from "@/components/search/LocationPicker";
import { useAuth } from "@/lib/AuthProvider";
import { onboardingService, accountService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type {
  WorkerOnboardingResult,
  UserLocation,
  AttributeGroupDef,
  AttributeDef,
  WorkerAttributeInput,
  ExperienceRange,
} from "@/lib/types";
import { experienceRanges } from "@/lib/types";
import { OnboardingCard, StepHeading, Field, fieldInput, Chip } from "./parts";

type Step = "basics" | "verify" | "industry" | "spec" | "details" | "done";
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const LANG_LEVELS = ["basic", "conversational", "advanced"] as const;

/** In-progress value for one attribute (only the field matching its type is set). */
type AttrVal = { options?: string[]; bool?: boolean; text?: string; date?: string; validUntil?: string };

/** Flatten the wizard's per-attribute state into the backend's attribute-answer list. */
function buildAttributePayload(groups: AttributeGroupDef[], values: Record<string, AttrVal>): WorkerAttributeInput[] {
  const out: WorkerAttributeInput[] = [];
  for (const g of groups) {
    for (const a of g.attributes) {
      const v = values[a.code];
      if (!v) continue;
      if (a.type === "SINGLE_SELECT") {
        const code = v.options?.[0];
        if (code) out.push({ attributeCode: a.code, optionCode: code });
      } else if (a.type === "MULTI_SELECT") {
        for (const code of v.options ?? []) out.push({ attributeCode: a.code, optionCode: code });
      } else if (a.type === "BOOL" || a.type === "BOOL_EXPIRY") {
        if (v.bool) out.push({ attributeCode: a.code, boolValue: true, validUntil: v.validUntil || null });
      } else if (a.type === "DATE") {
        if (v.date) out.push({ attributeCode: a.code, dateValue: v.date });
      } else if (a.type === "TEXT") {
        if (v.text?.trim()) out.push({ attributeCode: a.code, textValue: v.text.trim() });
      }
    }
  }
  return out;
}

export function WorkerOnboarding({
  initialName = "",
  initialEmail = "",
  resume = false,
}: {
  initialName?: string;
  initialEmail?: string;
  /** Resume mode: prefill from the existing profile and jump to the first unfilled step
   * (used by the "complete your profile" nudge — never restarts the whole wizard). */
  resume?: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("basics");
  // A specialist may work as a private person (first/last name) or as a company (company name).
  const [entityType, setEntityType] = useState<"person" | "company">("person");
  const [name, setName] = useState(initialName);
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [emailSeeded, setEmailSeeded] = useState(false);

  // Returning to finish setup (no query param): prefill the email from the signed-in account once.
  if (!emailSeeded && !email && user?.email) {
    setEmailSeeded(true);
    setEmail(user.email);
  }
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");
  // Default to Warsaw (matches the picker's default label) so the step is valid without re-selecting.
  const [location, setLocation] = useState<UserLocation | null>({
    city: "Warszawa",
    code: "warszawa",
    label: "Warszawa",
    lat: 52.2297,
    lng: 21.0122,
  });
  const baseLocation = location?.district ?? location?.city ?? location?.label ?? "";
  const [radiusKm, setRadiusKm] = useState(25);
  const [specs, setSpecs] = useState<string[]>([]);
  const [otherText, setOtherText] = useState(""); // "Inne" — custom role in the chosen industry
  const [expRange, setExpRange] = useState<ExperienceRange | null>(null); // experience bucket (optional)
  const [langs, setLangs] = useState<string[]>(["pl"]);
  const [langLevels, setLangLevels] = useState<Record<string, string>>({});
  const [attrValues, setAttrValues] = useState<Record<string, AttrVal>>({});
  const [result, setResult] = useState<WorkerOnboardingResult | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: industries = [] } = useQuery({
    queryKey: ["industries"],
    queryFn: onboardingService.getIndustries,
  });
  const { data: languages = [] } = useQuery({
    queryKey: ["languages"],
    queryFn: onboardingService.getLanguages,
  });
  const { data: specializations = [] } = useQuery({
    queryKey: ["specializations", industry],
    queryFn: () => onboardingService.getSpecializations(industry),
    enabled: !!industry,
  });
  // Catalog-driven attribute schema for the chosen industry + specializations (dynamic step).
  const { data: attrGroups = [], isLoading: attrsLoading } = useQuery({
    queryKey: ["attributes", industry, [...specs].sort().join(",")],
    queryFn: () => onboardingService.getAttributes(industry, specs),
    enabled: !!industry,
  });

  const industryLabel = industries.find((i) => i.id === industry)?.label ?? "";

  // Resume mode: load the existing profile once and prefill, then jump to the first unfilled step.
  const { data: existing } = useQuery({
    queryKey: ["mySpecialistProfileResume", locale],
    queryFn: () => accountService.getMySpecialistProfile(locale),
    enabled: resume,
  });
  // Prefill once when the existing profile arrives (render-phase seeding, same pattern as emailSeeded
  // above — avoids a setState-in-effect cascade). Converges because it guards on `resumed`.
  const [resumed, setResumed] = useState(false);
  if (resume && !resumed && existing) {
    setResumed(true);

    if (existing.displayName?.trim()) {
      setEntityType("person");
      setName(existing.displayName.trim());
    }
    if (existing.industryCodes?.[0]) setIndustry(existing.industryCodes[0]);
    if (existing.specializationCodes?.length) setSpecs(existing.specializationCodes);
    const firstCustom = existing.customSpecializations?.find(
      (c) => !existing.industryCodes?.length || c.industryCode === existing.industryCodes[0],
    );
    if (firstCustom) setOtherText(firstCustom.label);
    if (existing.district || (existing.lat && existing.lng)) {
      setLocation({
        city: existing.district ?? "",
        label: existing.district ?? "",
        lat: existing.lat || 52.2297,
        lng: existing.lng || 21.0122,
      });
    }
    if (existing.languages?.length) setLangs(existing.languages);
    if (existing.languageLevels) setLangLevels({ ...existing.languageLevels });
    if (existing.experienceRange) setExpRange(existing.experienceRange);
    // Rebuild per-attribute state from stored answers (MULTI_SELECT collapses many rows into options[]).
    const av: Record<string, AttrVal> = {};
    for (const a of existing.attributes ?? []) {
      const cur = av[a.attributeCode] ?? {};
      if (a.optionCode) cur.options = [...(cur.options ?? []), a.optionCode];
      if (a.boolValue != null) cur.bool = a.boolValue;
      if (a.textValue != null) cur.text = a.textValue;
      if (a.dateValue != null) cur.date = a.dateValue;
      if (a.validUntil != null) cur.validUntil = a.validUntil;
      av[a.attributeCode] = cur;
    }
    setAttrValues(av);

    // First unfilled step. Completeness = name + ≥1 specialization, so resume lands on whichever
    // is missing (never on the email-verify step — the account already exists and is verified).
    const hasName = !!existing.displayName?.trim();
    const hasSpec = (existing.specializationCodes?.length ?? 0) > 0 || (existing.customSpecializations?.length ?? 0) > 0;
    setStep(!hasName ? "basics" : !hasSpec ? "industry" : "details");
  }

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  async function finish() {
    setBusy(true);
    try {
      // `specs` holds codes; map back to labels for the (free-text) headline, send codes for the relation.
      const specLabels = specs.map((c) => specializations.find((o) => o.code === c)?.label ?? c);
      const custom = otherText.trim()
        ? [{ industryCode: industry, label: otherText.trim() }]
        : [];
      // Display name = company name, or first name (required) + last name (optional).
      const displayName =
        entityType === "company"
          ? companyName.trim()
          : [name.trim(), lastName.trim()].filter(Boolean).join(" ");
      const res = await onboardingService.completeWorker({
        name: displayName,
        email,
        phone,
        industry,
        baseLocation,
        lat: location?.lat,
        lng: location?.lng,
        radiusKm,
        specializations: otherText.trim() ? [...specLabels, otherText.trim()] : specLabels,
        specializationCodes: specs,
        customSpecializations: custom,
        languages: langs,
        languageLevels: langLevels,
        experienceRange: expRange ?? undefined,
        attributes: buildAttributePayload(attrGroups, attrValues),
      });
      setResult(res);
      setStep("done");
    } finally {
      setBusy(false);
    }
  }

  const total = 5;

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <header className="flex items-center justify-end px-4 py-4 sm:px-8">
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-2 sm:items-center sm:pt-0">
        {step === "basics" && (
          <OnboardingCard step={1} total={total} stepLabel={t("onboarding.stepOf", { n: 1, total })}>
            <StepHeading title={t("onboarding.wTitle")} subtitle={t("onboarding.wSubtitle")} />
            <div className="flex flex-col gap-3.5">
              <Field label={t("onboarding.wAs")}>
                <div className="grid grid-cols-2 gap-2">
                  {(["person", "company"] as const).map((tp) => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => setEntityType(tp)}
                      className={cn(
                        "rounded-tile border px-3 py-2.5 text-[13px] font-medium transition-colors",
                        entityType === tp
                          ? "border-ink bg-ink text-on-dark"
                          : "border-line-2 text-ink hover:bg-muted",
                      )}
                    >
                      {t(tp === "person" ? "onboarding.wAsPerson" : "onboarding.wAsCompany")}
                    </button>
                  ))}
                </div>
              </Field>
              {entityType === "person" ? (
                <>
                  <Field label={t("onboarding.wName")}>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("onboarding.wNamePlaceholder")} className={fieldInput} />
                  </Field>
                  <Field label={t("onboarding.wLastName")}>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t("onboarding.wLastNamePlaceholder")} className={fieldInput} />
                  </Field>
                </>
              ) : (
                <Field label={t("onboarding.wCompanyName")}>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={t("onboarding.wCompanyNamePlaceholder")} className={fieldInput} />
                </Field>
              )}
              <Field label={t("onboarding.wEmail")}>
                {/* Account email (from registration) — fixed, not editable. */}
                <input
                  type="email"
                  value={email}
                  readOnly
                  aria-readonly
                  className="w-full cursor-not-allowed rounded-tile border border-line-2 bg-muted px-3.5 py-2.5 text-sm text-ink-2 outline-none"
                />
                <p className="mt-1 text-[12px] text-ink-4">{t("onboarding.emailFromAccount")}</p>
              </Field>
              <Field label={t("onboarding.wPhone")}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("onboarding.wPhonePlaceholder")} className={fieldInput} />
              </Field>
            </div>
            <Button
              variant="dark"
              onClick={() => setStep(resume ? "industry" : "verify")}
              disabled={(entityType === "person" ? !name.trim() : !companyName.trim()) || !emailOk(email)}
              className="mt-5 w-full rounded-tile py-3 text-sm disabled:opacity-40"
            >
              {t("onboarding.next")}
            </Button>
            <p className="mt-3 text-center text-[11px] text-ink-4">{t("onboarding.loginNote")}</p>
          </OnboardingCard>
        )}

        {step === "verify" && (
          <VerifyStep
            email={email}
            stepLabel={t("onboarding.verifyStep")}
            total={total}
            onBack={() => setStep("basics")}
            onVerified={() => setStep("industry")}
          />
        )}

        {step === "industry" && (
          <OnboardingCard step={2} total={total} stepLabel={t("onboarding.stepOf", { n: 2, total })}>
            <StepHeading title={t("onboarding.wIndustryTitle")} subtitle={t("onboarding.wIndustrySubtitle")} />
            <p className="mb-2 text-[12px] font-semibold text-ink-3">{t("onboarding.wChooseIndustry")}</p>
            <div className="flex flex-wrap gap-2">
              {industries.map((i) => (
                <Chip key={i.id} label={i.label} selected={industry === i.id} onClick={() => { setIndustry(i.id); setSpecs([]); setOtherText(""); }} />
              ))}
            </div>
            <div className="mt-5">
              <Field label={t("onboarding.wBaseLocation")}>
                <LocationPicker value={location} onLocate={setLocation} onClear={() => setLocation(null)} />
              </Field>
            </div>
            <div className="mt-5 flex items-center justify-between text-[12px] font-semibold text-ink-3">
              <span>{t("onboarding.wRadius")}</span>
              <span className="text-ink">{t("filters.upTo", { km: radiusKm })}</span>
            </div>
            <input type="range" min={1} max={50} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="mt-1 w-full cursor-pointer accent-brand-violet" />
            <Button
              variant="dark"
              onClick={() => setStep("spec")}
              disabled={!industry || !baseLocation.trim()}
              className="mt-6 w-full rounded-tile py-3 text-sm disabled:opacity-40"
            >
              {t("onboarding.next")}
            </Button>
          </OnboardingCard>
        )}

        {step === "spec" && (
          <OnboardingCard step={3} total={total} stepLabel={t("onboarding.stepOf", { n: 3, total })}>
            <StepHeading title={t("onboarding.wSpecTitle")} subtitle={t("onboarding.wSpecSubtitle")} />
            <p className="mb-2 text-[12px] font-semibold text-ink-3">{t("onboarding.wSpecLabel", { industry: industryLabel })}</p>
            <div className="flex flex-wrap gap-2">
              {specializations.map((s) => (
                <Chip key={s.code} label={s.label} selected={specs.includes(s.code)} check onClick={() => toggle(specs, setSpecs, s.code)} />
              ))}
            </div>
            {/* "Inne" — a role outside the catalog; type it and you're still findable by industry. */}
            <input
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder={t("onboarding.wOtherPlaceholder")}
              className={`${fieldInput} mt-3`}
            />
            {/* Experience bucket — deliberate RANGES (never exact years, never age). Optional. */}
            <p className="mb-2 mt-5 text-[12px] font-semibold text-ink-3">{t("experience.question")}</p>
            <div className="flex flex-wrap gap-2">
              {experienceRanges.map((r) => (
                <Chip
                  key={r}
                  label={t(`experience.${r}`)}
                  selected={expRange === r}
                  onClick={() => setExpRange(expRange === r ? null : r)}
                />
              ))}
            </div>
            <p className="mb-2 mt-5 text-[12px] font-semibold text-ink-3">{t("onboarding.wLanguages")}</p>
            <div className="flex flex-wrap gap-2">
              {languages.map((l) => (
                <Chip key={l.code} label={l.name} selected={langs.includes(l.code)} onClick={() => toggle(langs, setLangs, l.code)} />
              ))}
            </div>
            {/* Proficiency per selected language — segmented control (nicer than a dropdown). */}
            {langs.length > 0 && (
              <div className="mt-3 flex flex-col gap-3.5">
                {langs.map((code) => {
                  const name = languages.find((l) => l.code === code)?.name ?? code;
                  return (
                    <div key={code} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                      <span className="text-[13px] font-medium text-ink-2">{name}</span>
                      <div className="inline-flex rounded-tile border border-line-2 p-0.5">
                        {LANG_LEVELS.map((lvl) => {
                          const on = langLevels[code] === lvl;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setLangLevels((m) => ({ ...m, [code]: on ? "" : lvl }))}
                              className={cn(
                                "rounded-[7px] px-2.5 py-1 text-[12px] font-medium transition-colors",
                                on ? "bg-ink text-on-dark" : "text-ink-3 hover:text-ink",
                              )}
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
            <Button variant="dark" onClick={() => setStep("details")} className="mt-6 w-full rounded-tile py-3 text-sm">
              {t("onboarding.next")}
            </Button>
          </OnboardingCard>
        )}

        {step === "details" && (
          <DetailsStep
            groups={attrGroups}
            loading={attrsLoading}
            values={attrValues}
            setValues={setAttrValues}
            busy={busy}
            onFinish={finish}
            total={total}
          />
        )}

        {step === "done" && result && (
          <OnboardingCard step={5} total={total} stepLabel={t("onboarding.stepOf", { n: 5, total })}>
            <div className="text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-chip text-success-chip-text">
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <h1 className="mt-4 text-xl font-bold tracking-[-0.5px] text-ink">
                {t("onboarding.wDoneTitle", { name: result.firstName })}
              </h1>
              <p className="mt-2 text-[13px] text-ink-3">
                {t("onboarding.wDoneDesc", { city: baseLocation || "Warszawa" })}
              </p>
            </div>
            {/* "Zaczynamy" → dashboard, where the platform tour auto-opens (it ends with the
                role-appropriate next step). */}
            <Button variant="dark" onClick={() => router.push("/account")} className="mt-5 w-full rounded-tile py-3 text-sm">
              {t("tour.finish")}
            </Button>
            <button onClick={() => router.push("/account/settings")} className="mt-3 block w-full text-center text-[13px] font-medium text-ink-3 hover:text-ink">
              {t("onboarding.wFinishLater")}
            </button>
          </OnboardingCard>
        )}
      </main>
    </div>
  );
}

function VerifyStep({
  email,
  stepLabel,
  total,
  onBack,
  onVerified,
}: {
  email: string;
  stepLabel: string;
  total: number;
  onBack: () => void;
  onVerified: () => void;
}) {
  const { t } = useI18n();
  const { reloadUser, sendVerificationEmail } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [seconds, setSeconds] = useState(45);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  // Poll quietly for a clicked verification link so the user advances without
  // pressing the button if they verify in another tab.
  useEffect(() => {
    const id = setInterval(async () => {
      if (await reloadUser()) onVerified();
    }, 4000);
    return () => clearInterval(id);
  }, [reloadUser, onVerified]);

  async function check() {
    setBusy(true);
    setError(false);
    try {
      if (await reloadUser()) onVerified();
      else setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setSeconds(45);
    await sendVerificationEmail();
  }

  return (
    <OnboardingCard step={1} total={total} stepLabel={stepLabel}>
      <div className="mb-5 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eef1ff] text-brand-violet">
          <MailCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-[-0.5px] text-ink">{t("onboarding.verifyTitle")}</h1>
        <p className="mx-auto mt-1.5 max-w-[320px] text-[13px] text-ink-3">
          {t("onboarding.verifyDesc", { email })}
        </p>
      </div>
      {error && <p className="mb-1 text-center text-[12px] text-[#b07400]">{t("onboarding.verifyError")}</p>}
      <p className="text-center text-[12px] text-ink-4">
        {seconds > 0 ? (
          t("onboarding.resendIn", { s: seconds })
        ) : (
          <button onClick={resend} className="font-semibold text-brand-violet hover:underline">
            {t("onboarding.resend")}
          </button>
        )}
      </p>
      <Button variant="dark" onClick={check} disabled={busy} className="mt-5 w-full rounded-tile py-3 text-sm disabled:opacity-40">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" />{t("onboarding.verifying")}</> : t("onboarding.verifyCta")}
      </Button>
      <button onClick={onBack} className="mt-3 block w-full text-center text-[13px] font-medium text-ink-3 hover:text-ink">
        {t("onboarding.help")}
      </button>
    </OnboardingCard>
  );
}

/** Dynamic, catalog-driven step: renders attribute groups for the chosen profession. Skippable. */
function DetailsStep({
  groups,
  loading,
  values,
  setValues,
  busy,
  onFinish,
  total,
}: {
  groups: AttributeGroupDef[];
  loading: boolean;
  values: Record<string, AttrVal>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, AttrVal>>>;
  busy: boolean;
  onFinish: () => void;
  total: number;
}) {
  const { t } = useI18n();
  const patch = (code: string, p: AttrVal) => setValues((m) => ({ ...m, [code]: { ...m[code], ...p } }));

  return (
    <OnboardingCard step={4} total={total} stepLabel={t("onboarding.stepOf", { n: 4, total })}>
      <StepHeading title={t("onboarding.detailsTitle")} subtitle={t("onboarding.detailsSubtitle")} />
      {loading ? (
        <div className="flex justify-center py-8 text-ink-3"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : groups.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-3">{t("onboarding.detailsEmpty")}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <section key={g.code}>
              <p className="mb-2 text-[12px] font-semibold text-ink-3">{g.label}</p>
              <div className="flex flex-col gap-4">
                {g.attributes.map((a) => (
                  <AttributeField key={a.code} attr={a} value={values[a.code]} onPatch={(p) => patch(a.code, p)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <Button variant="dark" onClick={onFinish} disabled={busy} className="mt-6 w-full rounded-tile py-3 text-sm">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" />{t("onboarding.verifying")}</> : t("onboarding.finish")}
      </Button>
      <button onClick={onFinish} disabled={busy} className="mt-3 block w-full text-center text-[13px] font-medium text-ink-3 hover:text-ink">
        {t("onboarding.skipStep")}
      </button>
    </OnboardingCard>
  );
}

/** Renders one attribute by its type, with an optional "(i)" help line. */
function AttributeField({ attr, value, onPatch }: { attr: AttributeDef; value?: AttrVal; onPatch: (p: AttrVal) => void }) {
  const { t } = useI18n();
  const selected = value?.options ?? [];

  const label = (
    <div className="mb-1.5">
      <span className="text-[13px] font-medium text-ink">{attr.label}</span>
      {attr.help && (
        <span className="mt-0.5 flex items-start gap-1.5 text-[11px] leading-snug text-ink-4">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          {attr.help}
        </span>
      )}
    </div>
  );

  if (attr.type === "SINGLE_SELECT" || attr.type === "MULTI_SELECT") {
    const multi = attr.type === "MULTI_SELECT";
    return (
      <div>
        {label}
        <div className="flex flex-wrap gap-2">
          {attr.options.map((o) => {
            const on = selected.includes(o.code);
            return (
              <Chip
                key={o.code}
                label={o.label}
                selected={on}
                check={multi}
                onClick={() =>
                  onPatch({
                    options: multi
                      ? on ? selected.filter((x) => x !== o.code) : [...selected, o.code]
                      : on ? [] : [o.code],
                  })
                }
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (attr.type === "BOOL" || attr.type === "BOOL_EXPIRY") {
    const on = value?.bool ?? false;
    return (
      <div>
        {label}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPatch({ bool: !on })}
            className={cn(
              "rounded-tile border px-3 py-1.5 text-[13px] font-medium transition-colors",
              on ? "border-ink bg-ink text-on-dark" : "border-line-2 text-ink hover:bg-muted",
            )}
          >
            {on ? t("onboarding.yes") : t("onboarding.no")}
          </button>
          {attr.type === "BOOL_EXPIRY" && on && (
            <input
              type="date"
              value={value?.validUntil ?? ""}
              onChange={(e) => onPatch({ validUntil: e.target.value })}
              aria-label={t("onboarding.validUntil")}
              className="rounded-tile border border-line-2 bg-surface px-2.5 py-1.5 text-[12px] text-ink outline-none"
            />
          )}
        </div>
      </div>
    );
  }

  if (attr.type === "DATE") {
    return (
      <div>
        {label}
        <input
          type="date"
          value={value?.date ?? ""}
          onChange={(e) => onPatch({ date: e.target.value })}
          className="rounded-tile border border-line-2 bg-surface px-2.5 py-1.5 text-[12px] text-ink outline-none"
        />
      </div>
    );
  }

  return (
    <div>
      {label}
      <input value={value?.text ?? ""} onChange={(e) => onPatch({ text: e.target.value })} className={fieldInput} />
    </div>
  );
}
