"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import { pl, enUS, uk } from "react-day-picker/locale";
import type { Locale as DateFnsLocale } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { ArrowLeft, Minus, Plus, CalendarCheck, PartyPopper } from "lucide-react";
import { SearchTopbar } from "@/components/search/SearchTopbar";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";
import { LocationButton } from "@/components/search/LocationButton";
import { presetDate } from "@/components/landing/WhenFilter";
import { useCreateJob } from "@/hooks/useCreateJob";
import { useAuth } from "@/lib/AuthProvider";
import { VerifyNotice } from "@/components/layout/VerifyNotice";
import { onboardingService } from "@/services";
import { warsawDistricts } from "@/services/warsaw-districts";
import { useI18n } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { JobDraft, WhenPreset, UserLocation } from "@/lib/types";

const dpLocales: Record<Locale, DateFnsLocale> = { pl, en: enUS, uk };
const intlTags: Record<Locale, string> = { pl: "pl-PL", en: "en-GB", uk: "uk-UA" };
const PRESETS: WhenPreset[] = ["today", "tomorrow", "weekend"];

const emptyDraft: JobDraft = {
  industry: "",
  profession: "",
  customProfession: "",
  title: "",
  description: "",
  date: null,
  preset: null,
  district: "",
  radiusKm: 10,
  people: 1,
  rate: null,
  hours: null,
  contactMethod: "app",
  phone: "",
};

export function PostJobScreen() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [draft, setDraft] = useState<JobDraft>(emptyDraft);
  const [otherMode, setOtherMode] = useState(false); // "Inne" — custom role with required text
  const [showErrors, setShowErrors] = useState(false);
  const [month, setMonth] = useState<Date>(new Date());
  const { mutate, isPending, data: result, isSuccess, reset } = useCreateJob();

  // Unverified ("inactive") accounts can't publish — the backend would reject it too.
  const notVerified = !!user && !user.emailVerified;

  // Branża → specjalizacja, on codes (consistent with search + onboarding).
  const { data: industries = [] } = useQuery({
    queryKey: ["industries"],
    queryFn: onboardingService.getIndustries,
  });
  const { data: specializations = [] } = useQuery({
    queryKey: ["specializations", draft.industry],
    queryFn: () => onboardingService.getSpecializations(draft.industry),
    enabled: !!draft.industry,
  });

  const set = (patch: Partial<JobDraft>) => setDraft((d) => ({ ...d, ...patch }));

  function pickIndustry(code: string) {
    set({ industry: code, profession: "", customProfession: "" });
    setOtherMode(false);
  }
  function pickSpecialization(code: string) {
    set({ profession: code, customProfession: "" });
    setOtherMode(false);
  }
  function pickOther() {
    set({ profession: "" });
    setOtherMode(true);
  }

  const errors = {
    industry: !draft.industry,
    profession: !otherMode && !draft.profession,
    customProfession: otherMode && !draft.customProfession.trim(),
    title: !draft.title.trim(),
    date: !draft.date,
    district: !draft.district,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const professionLabel = otherMode
    ? draft.customProfession || "—"
    : specializations.find((s) => s.code === draft.profession)?.label || "—";

  const dateLabel = draft.preset
    ? t(`filters.${draft.preset}`)
    : draft.date
      ? draft.date.toLocaleDateString(intlTags[locale], { day: "numeric", month: "long" })
      : "—";

  function submit() {
    if (notVerified) return;
    if (hasErrors) {
      setShowErrors(true);
      return;
    }
    mutate(draft);
  }

  if (isSuccess && result) {
    return (
      <>
        <SearchTopbar category={t("postJob.title")} />
        <main className="mx-auto flex w-full max-w-[1280px] flex-1 items-center justify-center px-4 py-20 sm:px-8">
          <div className="w-full max-w-md rounded-panel border border-line-3 bg-surface p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-chip text-success-chip-text">
              <PartyPopper className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-xl font-bold text-ink">{t("postJob.successTitle")}</h1>
            <p className="mt-2 text-sm text-ink-2">
              {t("postJob.successDesc", { count: result.notifiedCount })}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/search?q=${encodeURIComponent(draft.profession || draft.industry)}`}
                className="inline-flex w-full items-center justify-center rounded-tile bg-ink px-4 py-3 text-sm font-bold text-on-dark hover:bg-ink/90"
              >
                {t("postJob.successCta")}
              </Link>
              <button
                onClick={() => {
                  setDraft(emptyDraft);
                  setOtherMode(false);
                  setShowErrors(false);
                  reset();
                }}
                className="text-[13px] font-medium text-ink-3 hover:text-ink"
              >
                {t("postJob.successSecondary")}
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SearchTopbar category={t("postJob.title")} />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pt-6 pb-20 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-ink-2 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("postJob.title")}
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("postJob.title")}</h1>
          <p className="mt-1 text-[13px] text-ink-3">{t("postJob.subtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-6">
            {/* Profession: branża → specjalizacja (codes), with an "Inne" custom option */}
            <SectionCard title={t("postJob.sProfession")} hint={t("postJob.sProfessionHint")}>
              <p className="mb-2 text-[12px] font-semibold text-ink-3">{t("postJob.industryLabel")}</p>
              <div className="flex flex-wrap gap-2">
                {industries.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => pickIndustry(i.id)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors",
                      draft.industry === i.id
                        ? "border-ink bg-ink text-on-dark"
                        : "border-line-2 text-ink hover:bg-muted",
                    )}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
              {showErrors && errors.industry && <ErrText>{t("postJob.errIndustry")}</ErrText>}

              {draft.industry && (
                <>
                  <p className="mb-2 mt-4 text-[12px] font-semibold text-ink-3">
                    {t("postJob.specializationLabel")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {specializations.map((s) => (
                      <button
                        key={s.code}
                        onClick={() => pickSpecialization(s.code)}
                        className={cn(
                          "rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors",
                          draft.profession === s.code
                            ? "border-ink bg-ink text-on-dark"
                            : "border-line-2 text-ink hover:bg-muted",
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                    {/* "Inne" — a role outside the catalog; requires a typed name. */}
                    <button
                      onClick={pickOther}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors",
                        otherMode
                          ? "border-ink bg-ink text-on-dark"
                          : "border-line-2 text-ink hover:bg-muted",
                      )}
                    >
                      {t("postJob.otherProfession")}
                    </button>
                  </div>
                  {showErrors && errors.profession && <ErrText>{t("postJob.errProfession")}</ErrText>}

                  {otherMode && (
                    <>
                      <input
                        value={draft.customProfession}
                        onChange={(e) => set({ customProfession: e.target.value })}
                        placeholder={t("postJob.professionPlaceholder")}
                        className={inputCls(showErrors && errors.customProfession)}
                      />
                      {showErrors && errors.customProfession && (
                        <ErrText>{t("postJob.errCustomProfession")}</ErrText>
                      )}
                    </>
                  )}
                </>
              )}
            </SectionCard>

            {/* Details */}
            <SectionCard title={t("postJob.sDetails")}>
              <Label>{t("postJob.titleLabel")}</Label>
              <input
                value={draft.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder={t("postJob.titlePlaceholder")}
                className={inputCls(showErrors && errors.title)}
              />
              {showErrors && errors.title && <ErrText>{t("postJob.errTitle")}</ErrText>}
              <Label className="mt-4">{t("postJob.descLabel")}</Label>
              <textarea
                value={draft.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder={t("postJob.descPlaceholder")}
                rows={4}
                className={cn(inputCls(false), "resize-y")}
              />
            </SectionCard>

            {/* When */}
            <SectionCard title={t("postJob.sWhen")}>
              <div className="mb-3 flex flex-wrap gap-2">
                {PRESETS.map((id) => (
                  <button
                    key={id}
                    onClick={() => set({ preset: id, date: presetDate(id) })}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                      draft.preset === id
                        ? "border-ink bg-ink text-on-dark"
                        : "border-line-2 text-ink hover:bg-muted",
                    )}
                  >
                    {t(`filters.${id}`)}
                  </button>
                ))}
              </div>
              <div className="rdp-skill inline-block">
                <DayPicker
                  mode="single"
                  locale={dpLocales[locale]}
                  month={month}
                  onMonthChange={setMonth}
                  selected={draft.date ?? undefined}
                  disabled={{ before: new Date() }}
                  onSelect={(d) => d && set({ date: d, preset: null })}
                />
              </div>
              {showErrors && errors.date && <ErrText>{t("postJob.errDate")}</ErrText>}
            </SectionCard>

            {/* Where */}
            <SectionCard title={t("postJob.sWhere")}>
              <div className="mb-3">
                <LocationButton
                  value={null}
                  onLocate={(loc: UserLocation) => loc.district && set({ district: loc.district })}
                  onClear={() => {}}
                />
              </div>
              <Label>{t("postJob.districtLabel")}</Label>
              <select
                value={draft.district}
                onChange={(e) => set({ district: e.target.value })}
                className={cn(inputCls(showErrors && errors.district), "cursor-pointer")}
              >
                <option value="">{t("postJob.districtPlaceholder")}</option>
                {warsawDistricts.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              {showErrors && errors.district && <ErrText>{t("postJob.errDistrict")}</ErrText>}
              <div className="mt-4 flex items-center justify-between text-[12px] font-semibold text-ink-3">
                <span>{t("postJob.radiusLabel")}</span>
                <span className="text-ink">{t("filters.upTo", { km: draft.radiusKm })}</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={draft.radiusKm}
                onChange={(e) => set({ radiusKm: Number(e.target.value) })}
                className="mt-1 w-full cursor-pointer accent-brand-violet"
              />
            </SectionCard>

            {/* Extra */}
            <SectionCard title={t("postJob.sExtra")}>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>{t("postJob.peopleLabel")}</Label>
                  <Stepper value={draft.people} onChange={(v) => set({ people: v })} />
                </div>
                <div>
                  <Label>{t("postJob.rateLabel")}</Label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={draft.rate ?? ""}
                    onChange={(e) => set({ rate: e.target.value ? Number(e.target.value) : null })}
                    placeholder={t("postJob.ratePlaceholder")}
                    className={inputCls(false)}
                  />
                </div>
                <div>
                  <Label>{t("postJob.hoursLabel")}</Label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={draft.hours ?? ""}
                    onChange={(e) => set({ hours: e.target.value ? Number(e.target.value) : null })}
                    placeholder={t("postJob.hoursPlaceholder")}
                    className={inputCls(false)}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Contact */}
            <SectionCard title={t("postJob.sContact")}>
              <div className="flex gap-2">
                {(["app", "phone"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => set({ contactMethod: m })}
                    className={cn(
                      "flex-1 rounded-tile border px-4 py-2.5 text-[13px] font-medium transition-colors",
                      draft.contactMethod === m
                        ? "border-ink bg-ink text-on-dark"
                        : "border-line-2 text-ink hover:bg-muted",
                    )}
                  >
                    {t(m === "app" ? "postJob.contactApp" : "postJob.contactPhone")}
                  </button>
                ))}
              </div>
              {draft.contactMethod === "phone" && (
                <>
                  <Label className="mt-4">{t("postJob.phoneLabel")}</Label>
                  <input
                    value={draft.phone}
                    onChange={(e) => set({ phone: e.target.value })}
                    placeholder={t("postJob.phonePlaceholder")}
                    className={inputCls(false)}
                  />
                </>
              )}
            </SectionCard>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-panel border border-line-3 bg-surface p-5">
              <h2 className="text-[15px] font-semibold text-ink">{t("postJob.summary")}</h2>
              {draft.industry || draft.title || draft.date || draft.district ? (
                <dl className="mt-3 space-y-2 text-[13px]">
                  <SumRow label={t("postJob.sProfession")} value={professionLabel} />
                  <SumRow label={t("postJob.titleLabel")} value={draft.title || "—"} />
                  <SumRow label={t("postJob.sWhen")} value={dateLabel} />
                  <SumRow label={t("postJob.districtLabel")} value={draft.district || "—"} />
                  <SumRow label={t("postJob.peopleLabel")} value={String(draft.people)} />
                  {draft.rate != null && (
                    <SumRow label={t("postJob.rateLabel")} value={t("results.perHour", { rate: draft.rate })} />
                  )}
                </dl>
              ) : (
                <p className="mt-3 text-[13px] text-ink-3">{t("postJob.summaryEmpty")}</p>
              )}

              {notVerified ? (
                // Inactive account: hide the publish button entirely, show only the notice.
                <VerifyNotice variant="panel" message={t("verify.noticePostJob")} className="mt-5" />
              ) : (
                <>
                  <Button
                    variant="gradient"
                    onClick={submit}
                    disabled={isPending}
                    className="mt-5 w-full rounded-tile py-3 text-sm"
                  >
                    {isPending ? t("postJob.publishing") : t("postJob.submit")}
                  </Button>
                  <p className="mt-2 flex items-center justify-center gap-1 text-center text-[12px] text-ink-3">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    {t("postJob.free")}
                  </p>
                </>
              )}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

const inputCls = (error: boolean) => cn(inputClass(error), "mt-1.5");

function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-panel border border-line-3 bg-surface p-6">
      <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      {hint && <p className="mb-3 mt-0.5 text-[12px] text-ink-3">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block text-[12px] font-semibold text-ink-3", className)}>{children}</label>
  );
}

function ErrText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[12px] text-[#b07400]">{children}</p>;
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-ink-3">{label}</dt>
      <dd className="truncate text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="grid h-9 w-9 place-items-center rounded-tile border border-line-2 text-ink hover:bg-muted"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold text-ink">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="grid h-9 w-9 place-items-center rounded-tile border border-line-2 text-ink hover:bg-muted"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
