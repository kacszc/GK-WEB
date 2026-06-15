"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import { pl, enUS, uk } from "react-day-picker/locale";
import type { Locale as DateFnsLocale } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { ArrowLeft, Minus, Plus, CalendarCheck, PartyPopper, Eye, Search, FileText, Save } from "lucide-react";
import { SearchTopbar } from "@/components/search/SearchTopbar";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { CityCombobox, type PickedCity } from "./CityCombobox";
import { useCreateJob, useUpdateJob } from "@/hooks/useCreateJob";
import { useAuth } from "@/lib/AuthProvider";
import { VerifyNotice } from "@/components/layout/VerifyNotice";
import { onboardingService, geoService, jobsService } from "@/services";
import { rateUnitSuffix } from "@/lib/jobRate";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/lib/ToastProvider";
import { requestErrorToast } from "@/lib/errorToast";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { JobDraft, JobDuration, JobEngagement, JobRateType } from "@/lib/types";

const dpLocales: Record<Locale, DateFnsLocale> = { pl, en: enUS, uk };
const intlTags: Record<Locale, string> = { pl: "pl-PL", en: "en-GB", uk: "uk-UA" };
const DURATIONS: JobDuration[] = ["long_term", "few_weeks", "few_days", "one_day"];
const ENGAGEMENTS: JobEngagement[] = ["full_time", "part_time", "hours_per_day"];
const RATE_TYPES: JobRateType[] = ["hourly", "daily", "monthly", "per_job"];
const CURRENCIES = ["PLN", "EUR", "USD", "GBP", "UAH"];
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
  cityCode: "warszawa",
  cityName: "Warszawa",
  district: "",
  lat: 52.2297,
  lng: 21.0122,
  radiusKm: 10,
  people: 1,
  rate: null,
  rateTo: null,
  rateUndisclosed: false,
  currency: "PLN",
  rateType: "hourly",
  engagement: "full_time",
  hours: 8,
  contactMethod: "app",
  phone: "",
};

export function PostJobScreen({
  jobId,
  asDialog = false,
  onSaved,
}: {
  jobId?: string;
  /** Rendered inside a modal (no page chrome / auth guards) — used for in-account editing. */
  asDialog?: boolean;
  /** Called after a successful edit save (dialog mode closes instead of navigating). */
  onSaved?: () => void;
}) {
  const { t, locale } = useI18n();
  const { user, ready } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { show } = useToast();
  const isEdit = !!jobId;
  const [draft, setDraft] = useState<JobDraft>(emptyDraft);
  const [otherMode, setOtherMode] = useState(false); // "Inne" — custom role with required text
  const [showErrors, setShowErrors] = useState(false);
  const [withDate, setWithDate] = useState(false); // optional concrete date toggle
  const [month, setMonth] = useState<Date>(new Date());
  const create = useCreateJob();
  const update = useUpdateJob(jobId ?? "");
  const { mutate: createJob, isPending: creating, data: result, isSuccess, reset } = create;

  // Edit mode: load the job's current content and prefill the form once it arrives.
  const { data: editable, isLoading: loadingEditable } = useQuery({
    queryKey: ["editableJob", jobId],
    queryFn: () => jobsService.getEditable(jobId!, locale),
    enabled: isEdit,
  });
  // Seed the form from the loaded job exactly once — done during render (React's recommended way to
  // adjust state when an input changes), not in an effect, so there's no cascading-render lint hit.
  const [seeded, setSeeded] = useState(false);
  if (editable && !seeded) {
    setSeeded(true);
    setDraft(editable.draft);
    setOtherMode(!editable.draft.profession && !!editable.draft.customProfession);
    setWithDate(!!editable.draft.date);
  }

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

  // Districts come from the chosen curated city's backend zones (geocoded cities have none).
  const { data: zones = [] } = useQuery({
    queryKey: ["geoZones", draft.cityCode],
    queryFn: () => geoService.getZones(draft.cityCode),
    enabled: !!draft.cityCode,
  });

  const set = (patch: Partial<JobDraft>) => setDraft((d) => ({ ...d, ...patch }));

  function pickCity(c: PickedCity) {
    set({ cityCode: c.code, cityName: c.name, district: "", lat: c.lat, lng: c.lng });
  }

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
    // A location counts as set once a point is picked (city/map/geolocation) or a district is chosen.
    district: !draft.district && draft.lat == null,
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
  const rateUnit = rateUnitSuffix(draft.rateType, t);
  const rateLabel = draft.rateUndisclosed
    ? t("jobs.rateToAgree")
    : draft.rate != null
      ? draft.rateTo != null
        ? `${draft.rate}–${draft.rateTo} ${draft.currency}${rateUnit}`
        : t("jobs.rateFromCur", { rate: draft.rate, cur: draft.currency, unit: rateUnit })
      : "—";

  function validate() {
    if (notVerified) return false;
    if (hasErrors) {
      setShowErrors(true);
      return false;
    }
    return true;
  }

  // Create flow: publish now or save as a draft.
  function submit(publish: boolean) {
    if (!validate()) return;
    createJob({ draft, publish });
  }

  // Edit flow: save changes (status unchanged), then return to the job's management screen.
  function saveEdit() {
    if (!validate()) return;
    update.mutate(draft, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["myJobs"] });
        queryClient.invalidateQueries({ queryKey: ["job", jobId] });
        queryClient.invalidateQueries({ queryKey: ["editableJob", jobId] });
        show({ title: t("postJob.editSaved") });
        if (onSaved) onSaved();
        else router.push(`/account/jobs/${jobId}`);
      },
      onError: (e) => show(requestErrorToast(e, t)),
    });
  }

  // Success screen (create only). Drafts and published jobs get tailored actions.
  if (isSuccess && result) {
    const published = result.status === "active";
    // "Zobacz specjalistów" → specialist search pre-filtered by the job's profession (or industry),
    // carrying the chosen location so the results are already relevant.
    const sp = new URLSearchParams();
    if (draft.profession) sp.set("professions", draft.profession);
    else if (draft.industry) sp.set("industries", draft.industry);
    if (draft.lat != null && draft.lng != null) {
      sp.set("lat", String(draft.lat));
      sp.set("lng", String(draft.lng));
      if (draft.cityName) sp.set("city", draft.cityName);
      if (draft.cityCode) sp.set("code", draft.cityCode);
    }
    const specialistsHref = `/search?${sp.toString()}`;

    return (
      <>
        <SearchTopbar category={t("postJob.title")} />
        <main className="mx-auto flex w-full max-w-[1280px] flex-1 items-center justify-center px-4 py-20 sm:px-8">
          <div className="w-full max-w-md rounded-panel border border-line-3 bg-surface p-8 text-center">
            <span
              className={cn(
                "mx-auto grid h-14 w-14 place-items-center rounded-full",
                published ? "bg-success-chip text-success-chip-text" : "bg-pill text-ink-2",
              )}
            >
              {published ? <PartyPopper className="h-7 w-7" /> : <FileText className="h-7 w-7" />}
            </span>
            <h1 className="mt-4 text-xl font-bold text-ink">
              {published ? t("postJob.successTitle") : t("postJob.draftSavedTitle")}
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              {published ? t("postJob.successDesc") : t("postJob.draftSavedDesc")}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/account/jobs/${result.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-tile bg-ink px-4 py-3 text-sm font-bold text-on-dark hover:bg-ink/90"
              >
                <Eye className="h-4 w-4" />
                {t("postJob.viewJob")}
              </Link>
              {published && (
                <Link
                  href={specialistsHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-tile border border-line-2 bg-surface px-4 py-3 text-sm font-semibold text-ink hover:bg-muted"
                >
                  <Search className="h-4 w-4" />
                  {t("postJob.successCta")}
                </Link>
              )}
              <button
                onClick={() => {
                  setDraft(emptyDraft);
                  setOtherMode(false);
                  setWithDate(false);
                  setShowErrors(false);
                  reset();
                }}
                className="mt-1 text-[13px] font-medium text-ink-3 hover:text-ink"
              >
                {t("postJob.successSecondary")}
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Not logged in → prompt to sign in instead of rendering the form (publishing requires an account).
  // In dialog mode we're already inside the authenticated account area, so skip these guards.
  if (!asDialog && ready && !user) {
    return (
      <>
        <SearchTopbar category={t("postJob.title")} />
        <main className="mx-auto flex w-full max-w-[1280px] flex-1 items-center justify-center px-4 py-20 sm:px-8">
          <div className="w-full max-w-md rounded-card border border-line-3 bg-surface p-7 text-center shadow-search">
            <h1 className="text-lg font-bold text-ink">{t("postJob.title")}</h1>
            <p className="mt-2 text-sm text-ink-2">{t("postJob.loginRequired")}</p>
            <Link
              href={`/login?redirect=${encodeURIComponent("/post-job")}`}
              className="mt-5 inline-flex w-full items-center justify-center rounded-tile bg-ink px-4 py-2.5 text-sm font-bold text-on-dark hover:bg-ink/90"
            >
              {t("auth.loginCta")}
            </Link>
          </div>
        </main>
      </>
    );
  }

  // Logged in but a specialist → posting jobs is employer-only (the backend enforces ROLE_EMPLOYER).
  if (!asDialog && ready && user && user.role !== "employer") {
    return (
      <>
        <SearchTopbar category={t("postJob.title")} />
        <main className="mx-auto flex w-full max-w-[1280px] flex-1 items-center justify-center px-4 py-20 sm:px-8">
          <div className="w-full max-w-md rounded-card border border-line-3 bg-surface p-7 text-center shadow-search">
            <h1 className="text-lg font-bold text-ink">{t("postJob.title")}</h1>
            <p className="mt-2 text-sm text-ink-2">{t("postJob.employerOnly")}</p>
            <Link
              href="/search"
              className="mt-5 inline-flex w-full items-center justify-center rounded-tile bg-ink px-4 py-2.5 text-sm font-bold text-on-dark hover:bg-ink/90"
            >
              {t("profile.back")}
            </Link>
          </div>
        </main>
      </>
    );
  }

  const screenTitle = isEdit ? t("postJob.editTitle") : t("postJob.title");

  const body =
    isEdit && loadingEditable ? (
      <div className="skeleton h-[60vh] rounded-panel" />
    ) : (
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
                          onClick={() => pickSpecialization(s.code!)}
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

              {/* Where — curated city (with districts) or any geocoded city, refined by radius */}
              <SectionCard title={t("postJob.sWhere")}>
                <Label>{t("postJob.cityLabel")}</Label>
                <CityCombobox cityCode={draft.cityCode} cityName={draft.cityName} onPick={pickCity} />

                {/* Districts come from the curated city's backend zones — shown only when it has any. */}
                {draft.cityCode && zones.length > 0 && (
                  <>
                    <Label className="mt-4">{t("postJob.districtLabel")}</Label>
                    <select
                      value={draft.district}
                      onChange={(e) => {
                        const z = zones.find((x) => x.name === e.target.value);
                        set({ district: e.target.value, ...(z ? { lng: z.center[0], lat: z.center[1] } : {}) });
                      }}
                      className={cn(inputCls(false), "cursor-pointer")}
                    >
                      <option value="">{t("postJob.districtPlaceholder")}</option>
                      {zones.map((z) => (
                        <option key={z.name} value={z.name}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}

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

              {/* Details — people, workload type, pay model + rate */}
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

                {/* Pay model: hourly / daily / monthly / per-job */}
                <div className="mt-4">
                  <Label>{t("postJob.rateTypeLabel")}</Label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {RATE_TYPES.map((rt) => (
                      <button
                        key={rt}
                        onClick={() => set({ rateType: rt })}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                          draft.rateType === rt
                            ? "border-ink bg-ink text-on-dark"
                            : "border-line-2 text-ink hover:bg-muted",
                        )}
                      >
                        {t(`postJob.rateType.${rt}`)}
                      </button>
                    ))}
                  </div>
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
                        <div className="mt-1.5">
                          <SearchSelect
                            value={draft.currency}
                            onChange={(v) => set({ currency: v })}
                            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                            searchPlaceholder={t("postJob.search")}
                          />
                        </div>
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
                    <p className="mt-1.5 text-[12px] text-ink-3">
                      {t("postJob.rateHint")}
                      {rateLabel !== "—" ? ` · ${rateLabel}` : ""}
                    </p>
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
                    <SumRow
                      label={t("postJob.locationLabel")}
                      value={[draft.district, draft.cityName].filter(Boolean).join(", ") || "—"}
                    />
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
                ) : isEdit ? (
                  <Button
                    variant="gradient"
                    onClick={saveEdit}
                    disabled={update.isPending}
                    className="mt-5 w-full rounded-tile py-3 text-sm"
                  >
                    <Save className="h-4 w-4" />
                    {update.isPending ? t("postJob.savingEdit") : t("postJob.saveEdit")}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="gradient"
                      onClick={() => submit(true)}
                      disabled={creating}
                      className="mt-5 w-full rounded-tile py-3 text-sm"
                    >
                      {creating ? t("postJob.publishing") : t("postJob.submit")}
                    </Button>
                    <button
                      onClick={() => submit(false)}
                      disabled={creating}
                      className="mt-2 w-full rounded-tile border border-line-2 bg-surface py-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-muted disabled:opacity-60"
                    >
                      {t("postJob.saveDraft")}
                    </button>
                    <p className="mt-2 flex items-center justify-center gap-1 text-center text-[12px] text-ink-3">
                      <CalendarCheck className="h-3.5 w-3.5" />
                      {t("postJob.free")}
                    </p>
                  </>
                )}
              </div>
            </aside>
      </div>
    );

  // Dialog mode (in-account editing): just the form, the modal provides the chrome.
  if (asDialog) {
    return body;
  }

  return (
    <>
      <SearchTopbar category={screenTitle} />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pt-6 pb-20 sm:px-8">
        <Link
          href={isEdit ? `/account/jobs/${jobId}` : "/"}
          className="inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-ink-2 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEdit ? t("jobDetail.back") : t("postJob.title")}
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{screenTitle}</h1>
          <p className="mt-1 text-[13px] text-ink-3">{isEdit ? t("postJob.editSubtitle") : t("postJob.subtitle")}</p>
        </div>

        {body}
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
