"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MailCheck, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useAuth } from "@/lib/AuthProvider";
import { onboardingService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { WorkerOnboardingResult } from "@/lib/types";
import { OnboardingCard, StepHeading, Field, fieldInput, Chip } from "./parts";

type Step = "basics" | "verify" | "industry" | "spec" | "done";
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function WorkerOnboarding({
  initialName = "",
  initialEmail = "",
}: {
  initialName?: string;
  initialEmail?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();

  const [step, setStep] = useState<Step>("basics");
  // A specialist may work as a private person (first/last name) or as a company (company name).
  const [entityType, setEntityType] = useState<"person" | "company">("person");
  const [name, setName] = useState(initialName);
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [baseLocation, setBaseLocation] = useState("");
  const [radiusKm, setRadiusKm] = useState(25);
  const [specs, setSpecs] = useState<string[]>([]);
  const [otherText, setOtherText] = useState(""); // "Inne" — custom role in the chosen industry
  const [langs, setLangs] = useState<string[]>(["Polski"]);
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

  const industryLabel = industries.find((i) => i.id === industry)?.label ?? "";

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
        radiusKm,
        specializations: otherText.trim() ? [...specLabels, otherText.trim()] : specLabels,
        specializationCodes: specs,
        customSpecializations: custom,
        languages: langs,
      });
      setResult(res);
      setStep("done");
    } finally {
      setBusy(false);
    }
  }

  const total = 4;

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
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("onboarding.wEmailPlaceholder")} className={fieldInput} />
              </Field>
              <Field label={t("onboarding.wPhone")}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("onboarding.wPhonePlaceholder")} className={fieldInput} />
              </Field>
            </div>
            <Button
              variant="dark"
              onClick={() => setStep("verify")}
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
                <input value={baseLocation} onChange={(e) => setBaseLocation(e.target.value)} placeholder={t("onboarding.wBaseLocationPlaceholder")} className={fieldInput} />
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
            <p className="mb-2 mt-5 text-[12px] font-semibold text-ink-3">{t("onboarding.wLanguages")}</p>
            <div className="flex flex-wrap gap-2">
              {languages.map((l) => (
                <Chip key={l.code} label={l.name} selected={langs.includes(l.code)} onClick={() => toggle(langs, setLangs, l.code)} />
              ))}
            </div>
            <Button variant="dark" onClick={finish} disabled={busy} className="mt-6 w-full rounded-tile py-3 text-sm">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" />{t("onboarding.verifying")}</> : t("onboarding.next")}
            </Button>
            <button onClick={finish} disabled={busy} className="mt-3 block w-full text-center text-[13px] font-medium text-ink-3 hover:text-ink">
              {t("onboarding.skipStep")}
            </button>
          </OnboardingCard>
        )}

        {step === "done" && result && (
          <OnboardingCard step={4} total={total} stepLabel={t("onboarding.stepOf", { n: 4, total })}>
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
            <div className="mt-5 rounded-panel bg-muted p-4">
              <p className="text-[11px] font-bold tracking-[0.5px] text-ink-3">{t("onboarding.wTrustLabel")}</p>
              <div className="mt-1.5 flex items-start gap-3">
                <span className="text-3xl font-bold text-[#e0a400]">{result.trustScore}</span>
                <p className="text-[12px] leading-snug text-ink-3">{t("onboarding.wTrustHint")}</p>
              </div>
            </div>
            <Button variant="dark" onClick={() => router.push("/account")} className="mt-5 w-full rounded-tile py-3 text-sm">
              {t("onboarding.wGoDashboard")}
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
