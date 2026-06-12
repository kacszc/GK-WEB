"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Gift } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useWallet } from "@/lib/WalletProvider";
import { useAuth } from "@/lib/AuthProvider";
import { onboardingService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import type { GusCompany, EmployerOnboardingResult } from "@/lib/types";
import { OnboardingCard, StepHeading, Field, fieldInput, Chip } from "./parts";

type Step = "company" | "verified" | "needs" | "done";
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const nipOk = (v: string) => v.replace(/\D/g, "").length === 10;

export function EmployerOnboarding({ initialEmail = "" }: { initialEmail?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const { topUp } = useWallet();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("company");
  const [nip, setNip] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [emailSeeded, setEmailSeeded] = useState(false);

  // Returning to finish setup (no query param): prefill the email from the signed-in account once.
  if (!emailSeeded && !email && user?.email) {
    setEmailSeeded(true);
    setEmail(user.email);
  }
  const [company, setCompany] = useState<GusCompany | null>(null);
  const [industries, setIndustries] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<EmployerOnboardingResult | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: industryOptions = [] } = useQuery({
    queryKey: ["industries"],
    queryFn: onboardingService.getIndustries,
  });
  const { data: teamSizes = [] } = useQuery({
    queryKey: ["teamSizes"],
    queryFn: onboardingService.getTeamSizes,
  });

  const total = 4;

  async function verifyGus() {
    setBusy(true);
    try {
      const c = await onboardingService.lookupGus(nip);
      setCompany(c);
      setStep("verified");
    } finally {
      setBusy(false);
    }
  }

  function toggleIndustry(id: string) {
    setIndustries((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  }

  async function finish() {
    if (!company) return;
    setBusy(true);
    try {
      const res = await onboardingService.completeEmployer({ company, email, industries, teamSize, location });
      topUp(res.bonusTokens);
      setResult(res);
      setStep("done");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <header className="flex items-center justify-end px-4 py-4 sm:px-8">
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-2 sm:items-center sm:pt-0">
        {step === "company" && (
          <OnboardingCard step={1} total={total} stepLabel={t("onboarding.eStepOf", { n: 1, total })}>
            <StepHeading title={t("onboarding.eCompanyTitle")} subtitle={t("onboarding.eCompanySubtitle")} />
            <div className="flex flex-col gap-3.5">
              <Field label={t("onboarding.eNip")}>
                <input value={nip} onChange={(e) => setNip(e.target.value)} placeholder={t("onboarding.eNipPlaceholder")} className={fieldInput} />
              </Field>
              <Field label={t("onboarding.eEmail")}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("onboarding.eEmailPlaceholder")} className={fieldInput} />
              </Field>
            </div>
            <Button variant="dark" onClick={verifyGus} disabled={!nipOk(nip) || !emailOk(email) || busy} className="mt-5 w-full rounded-tile py-3 text-sm disabled:opacity-40">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" />{t("onboarding.eVerifyingGus")}</> : t("onboarding.eVerifyGus")}
            </Button>
          </OnboardingCard>
        )}

        {step === "verified" && company && (
          <OnboardingCard step={2} total={total} stepLabel={t("onboarding.eStepOf", { n: 2, total })}>
            <div className="mb-5 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-chip text-success-chip-text">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <h1 className="mt-4 text-xl font-bold tracking-[-0.5px] text-ink">{t("onboarding.eVerifiedTitle")}</h1>
            </div>
            <dl className="overflow-hidden rounded-panel bg-muted">
              <GusRow label={t("onboarding.eRowName")} value={company.name} />
              <GusRow label={t("onboarding.eRowNip")} value={company.nip} />
              <GusRow label={t("onboarding.eRowRegon")} value={company.regon} />
              <GusRow label={t("onboarding.eRowAddress")} value={company.address} />
              <GusRow label={t("onboarding.eRowStatus")} value={company.status} />
            </dl>
            <Button variant="dark" onClick={() => setStep("needs")} className="mt-5 w-full rounded-tile py-3 text-sm">
              {t("onboarding.eConfirm")}
            </Button>
          </OnboardingCard>
        )}

        {step === "needs" && (
          <OnboardingCard step={3} total={total} stepLabel={t("onboarding.eStepOf", { n: 3, total })}>
            <StepHeading title={t("onboarding.eNeedsTitle")} subtitle={t("onboarding.eNeedsSubtitle")} />
            <div className="flex flex-wrap gap-2">
              {industryOptions.map((i) => (
                <Chip key={i.id} label={i.label} selected={industries.includes(i.id)} onClick={() => toggleIndustry(i.id)} />
              ))}
            </div>
            <div className="mt-5">
              <Field label={t("onboarding.eTeamSize")}>
                <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className={`${fieldInput} cursor-pointer`}>
                  <option value="">—</option>
                  {teamSizes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-4">
              <Field label={t("onboarding.eLocation")}>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t("onboarding.eLocationPlaceholder")} className={fieldInput} />
              </Field>
            </div>
            <Button variant="dark" onClick={finish} disabled={industries.length === 0 || !location.trim() || busy} className="mt-6 w-full rounded-tile py-3 text-sm disabled:opacity-40">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" />{t("onboarding.eVerifyingGus")}</> : t("onboarding.next")}
            </Button>
          </OnboardingCard>
        )}

        {step === "done" && result && (
          <OnboardingCard step={4} total={total} stepLabel={t("onboarding.eStepOf", { n: 4, total })}>
            <div className="text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-chip text-success-chip-text">
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <h1 className="mt-4 text-xl font-bold tracking-[-0.5px] text-ink">
                {t("onboarding.eDoneTitle", { company: shortCompany(result.companyName) })}
              </h1>
              <p className="mx-auto mt-2 max-w-[340px] text-[13px] text-ink-3">{t("onboarding.eDoneDesc")}</p>
            </div>
            <div className="mt-5 rounded-panel bg-ink p-4 text-on-dark">
              <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.5px] text-[#ffcf6b]">
                <Gift className="h-3.5 w-3.5" />
                {t("onboarding.eGiftLabel")}
              </p>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="text-3xl font-bold">{result.bonusTokens}</span>
                <p className="text-[12px] leading-snug text-on-dark/80">{t("onboarding.eGiftDesc", { n: result.bonusTokens })}</p>
              </div>
            </div>
            <Button variant="dark" onClick={() => router.push("/post-job")} className="mt-5 w-full rounded-tile py-3 text-sm">
              {t("onboarding.ePostJob")}
            </Button>
          </OnboardingCard>
        )}
      </main>
    </div>
  );
}

function GusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line-2 px-4 py-2.5 last:border-0">
      <dt className="shrink-0 text-[12px] text-ink-3">{label}</dt>
      <dd className="text-right text-[13px] font-semibold text-ink">{value}</dd>
    </div>
  );
}

function shortCompany(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}
