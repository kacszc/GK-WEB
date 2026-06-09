"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import { pl, enUS, uk } from "react-day-picker/locale";
import type { Locale as DateFnsLocale } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { ArrowLeft, Minus, Plus, CalendarCheck, PartyPopper, MapPin } from "lucide-react";
import { SearchTopbar } from "@/components/search/SearchTopbar";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";
import { LocationButton } from "@/components/search/LocationButton";
import { MapPickerDialog } from "./MapPickerDialog";
import { useCreateJob } from "@/hooks/useCreateJob";
import { useAuth } from "@/lib/AuthProvider";
import { VerifyNotice } from "@/components/layout/VerifyNotice";
import { onboardingService } from "@/services";
import { warsawDistricts } from "@/services/warsaw-districts";
import { useI18n } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { JobDraft, JobDuration, JobEngagement, UserLocation } from "@/lib/types";

const dpLocales: Record<Locale, DateFnsLocale> = { pl, en: enUS, uk };
const intlTags: Record<Locale, string> = { pl: "pl-PL", en: "en-GB", uk: "uk-UA" };
const DURATIONS: JobDuration[] = ["long_term", "few_weeks", "few_days", "one_day"];
const ENGAGEMENTS: JobEngagement[] = ["full_time", "part_time", "hours_per_day"];
// Default hours/day used to auto-fill the workload (and a cosmetic weekly estimate).
const AUTO_HOURS: Record<JobEngagement, number | null> = { full_time: 8, part_time: 4, hours_per_day: null };

const emptyDraft: JobDraft = {
  industry: "",
  profession: "",
  customProfession: "",
  title: "",
  description: "",
  duration: "",
  date: null,
  dateTo: null,
  district: "",
  lat: null,
  lng: null,
  radiusKm: 10,
  people: 1,
  rate: null,
  rateTo: null,
  rateUndisclosed: false,
  currency: "PLN",
  engagement: "full_time",
  hours: 8,
  contactMethod: "app",
  phone: "",
};

export function PostJobScreen() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [draft, setDraft] = useState<JobDraft>(emptyDraft);
  const [otherMode, setOtherMode] = useState(false); // "Inne" — custom role with required text
  const [showErrors, setShowErrors] = useState(false);
  const [withDate, setWithDate] = useState(false); // optional concrete date toggle
  const [mapOpen, setMapOpen] = useState(false);
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
  // Engagement drives the auto-filled hours/day (explicit only for hours_per_day).
  function pickEngagement(e: JobEngagement) {
    set({ engagement: e, hours: AUTO_HOURS[e] ?? draft.hours ?? 8 });
  }

  const errors = {
    industry: !draft.industry,
    profession: !otherMode && !draft.profession,
    customProfession: otherMode && !draft.customProfession.trim(),
    title: !draft.title.trim(),
    duration: !draft.duration,
    district: !draft.district,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const professionLabel = otherMode
    ? draft.customProfession || "—"
    : specializations.find((s) => s.code === draft.profession)?.label || "—";

  const fmtDate = (d: Date) => d.toLocaleDateString(intlTags[locale], { day: "numeric", month: "long" });
  const dateStr = draft.date ? (draft.dateTo ? `${fmtDate(draft.date)} – ${fmtDate(draft.dateTo)}` : fmtDate(draft.date)) : "";
  const whenLabel = draft.duration
    ? t(`postJob.dur.${draft.duration}`) + (dateStr ? ` · ${dateStr}` : "")
    : "—";
  const rateLabel = draft.rateUndisclosed
    ? t("jobs.rateToAgree")
    : draft.rate != null
      ? draft.rateTo != null
        ? `${draft.rate}–${draft.rateTo} ${draft.currency}/h`
        : t("jobs.rateFromCur", { rate: draft.rate, cur: draft.currency })
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
                  setWithDate(false);
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

            {/* When — engagement duration + optional concrete date */}
            <SectionCard title={t("postJob.sWhen")}>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((id) => (
                  <button
                    key={id}
                    onClick={() => set(id === "one_day" ? { duration: id, dateTo: null } : { duration: id })}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                      draft.duration === id
                        ? "border-ink bg-ink text-on-dark"
                        : "border-line-2 text-ink hover:bg-muted",
                    )}
                  >
                    {t(`postJob.dur.${id}`)}
                  </button>
                ))}
              </div>
              {showErrors && errors.duration && <ErrText>{t("postJob.errDuration")}</ErrText>}

              <label className="mt-4 flex cursor-pointer items-center gap-2 text-[13px] text-ink">
                <input
                  type="checkbox"
                  checked={withDate}
                  onChange={(e) => {
                    setWithDate(e.target.checked);
                    if (!e.target.checked) set({ date: null, dateTo: null });
                  }}
                  className="accent-brand-violet"
                />
                {/* "Jeden dzień" → a single date; longer durations → a date range. */}
                {t(draft.duration === "one_day" ? "postJob.withDate" : "postJob.withDateRange")}
              </label>
              {withDate && (
                <div className="rdp-skill mt-2 inline-block rounded-panel border border-line-3 bg-surface p-2">
                  {draft.duration === "one_day" ? (
                    <DayPicker
                      mode="single"
                      locale={dpLocales[locale]}
                      month={month}
                      onMonthChange={setMonth}
                      selected={draft.date ?? undefined}
                      disabled={{ before: new Date() }}
                      onSelect={(d) => set({ date: d ?? null, dateTo: null })}
                    />
                  ) : (
                    /* Range: first click = start, second = end. */
                    <DayPicker
                      mode="range"
                      locale={dpLocales[locale]}
                      month={month}
                      onMonthChange={setMonth}
                      selected={{ from: draft.date ?? undefined, to: draft.dateTo ?? undefined }}
                      disabled={{ before: new Date() }}
                      onSelect={(range) => set({ date: range?.from ?? null, dateTo: range?.to ?? null })}
                    />
                  )}
                </div>
              )}
            </SectionCard>

            {/* Where — same location picking as the filters, plus a map pin */}
            <SectionCard title={t("postJob.sWhere")}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <LocationButton
                  value={null}
                  onLocate={(loc: UserLocation) =>
                    set({ district: loc.district ?? draft.district, lat: loc.lat, lng: loc.lng })
                  }
                  onClear={() => {}}
                />
                <span className="text-[12px] font-medium uppercase tracking-wide text-ink-4">
                  {t("postJob.or")}
                </span>
                <button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-tile border border-line-2 bg-surface px-3 py-2 text-[13px] font-medium text-ink hover:bg-muted"
                >
                  <MapPin className="h-4 w-4 text-brand-violet" />
                  {t("postJob.pickOnMap")}
                </button>
              </div>
              {/* District + radius only make sense once a location is set (via geolocation or map). */}
              {draft.lat != null ? (
                <>
                  <p className="mb-2 text-[12px] text-success">{t("postJob.pinSet")}</p>
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
                </>
              ) : (
                <p className={cn("text-[12px]", showErrors && errors.district ? "text-[#b07400]" : "text-ink-3")}>
                  {t("postJob.locationPrompt")}
                </p>
              )}
            </SectionCard>

            {/* Details — people, workload type, rate range */}
            <SectionCard title={t("postJob.sExtra")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t("postJob.peopleLabel")}</Label>
                  <Stepper value={draft.people} onChange={(v) => set({ people: v })} />
                </div>
                <div>
                  <Label>{t("postJob.engagementLabel")}</Label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {ENGAGEMENTS.map((e) => (
                      <button
                        key={e}
                        onClick={() => pickEngagement(e)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                          draft.engagement === e
                            ? "border-ink bg-ink text-on-dark"
                            : "border-line-2 text-ink hover:bg-muted",
                        )}
                      >
                        {t(`postJob.eng.${e}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hours: explicit per-day for hours_per_day; auto-estimate for full/part time */}
              <div className="mt-4">
                {draft.engagement === "hours_per_day" ? (
                  <>
                    <Label>{t("postJob.hoursLabel")}</Label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={draft.hours ?? ""}
                      onChange={(e) => set({ hours: e.target.value ? Number(e.target.value) : null })}
                      placeholder={t("postJob.hoursPlaceholder")}
                      className={inputCls(false)}
                    />
                  </>
                ) : (
                  <p className="text-[12px] text-ink-3">
                    {t("postJob.hoursAuto", { h: draft.hours ?? 0, week: (draft.hours ?? 0) * 5 })}
                  </p>
                )}
              </div>

              {/* Rate: "to be agreed" toggle, else currency + range ("od" + optional "do") */}
              <label className="mt-4 flex cursor-pointer items-center gap-2 text-[13px] text-ink">
                <input
                  type="checkbox"
                  checked={draft.rateUndisclosed}
                  onChange={(e) => set({ rateUndisclosed: e.target.checked })}
                  className="accent-brand-violet"
                />
                {t("postJob.rateUndisclosed")}
              </label>
              {!draft.rateUndisclosed && (
                <>
                  <div className="mt-3 grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label>{t("postJob.currencyLabel")}</Label>
                      <select
                        value={draft.currency}
                        onChange={(e) => set({ currency: e.target.value })}
                        className={cn(inputCls(false), "cursor-pointer")}
                      >
                        {["PLN", "EUR", "USD", "GBP", "UAH"].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>{t("postJob.rateFromLabel")}</Label>
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
                      <Label>{t("postJob.rateToLabel")}</Label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={draft.rateTo ?? ""}
                        onChange={(e) => set({ rateTo: e.target.value ? Number(e.target.value) : null })}
                        placeholder={t("postJob.rateToPlaceholder")}
                        className={inputCls(false)}
                      />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[12px] text-ink-3">{t("postJob.rateHint")}</p>
                </>
              )}
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
              {draft.industry || draft.title || draft.duration || draft.district ? (
                <dl className="mt-3 space-y-2 text-[13px]">
                  <SumRow label={t("postJob.sProfession")} value={professionLabel} />
                  <SumRow label={t("postJob.titleLabel")} value={draft.title || "—"} />
                  <SumRow label={t("postJob.sWhen")} value={whenLabel} />
                  <SumRow label={t("postJob.locationLabel")} value={draft.district || "—"} />
                  <SumRow label={t("postJob.engagementLabel")} value={t(`postJob.eng.${draft.engagement}`)} />
                  <SumRow label={t("postJob.peopleLabel")} value={String(draft.people)} />
                  {(draft.rate != null || draft.rateUndisclosed) && (
                    <SumRow label={t("postJob.rateLabel")} value={rateLabel} />
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

      <MapPickerDialog
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        center={draft.lat != null && draft.lng != null ? [draft.lng, draft.lat] : null}
        onPick={(loc) => set({ district: loc.district || draft.district, lat: loc.lat, lng: loc.lng })}
      />
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
