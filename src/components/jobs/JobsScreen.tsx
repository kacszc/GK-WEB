"use client";

import { useState, useSyncExternalStore } from "react";
import { MapPin, Clock, Coins, BadgeCheck, Check, Loader2 } from "lucide-react";
import { SearchTopbar } from "@/components/search/SearchTopbar";
import { ResultsToolbar, type ResultsView } from "@/components/search/ResultsToolbar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { SpecialistCardSkeleton } from "@/components/search/SpecialistCard";
import { JobsFilterSidebar } from "./JobsFilterSidebar";
import { JobsMapView } from "./JobsMapView";
import { useJobSearch } from "@/hooks/useJobSearch";
import { jobsService, type JobFilters } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/ToastProvider";
import { requestErrorToast } from "@/lib/errorToast";
import { VerifyNotice } from "@/components/layout/VerifyNotice";
import { jobRateLabel } from "@/lib/jobRate";
import { cn } from "@/lib/cn";
import type { JobPosting, UserLocation } from "@/lib/types";

const CITY = "Warszawa";

/** True at >= lg (1024px). Drops the desktop-only split view on mobile. */
function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(min-width: 1024px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true,
  );
}

export function JobsScreen({
  initialQuery,
  initialProfession,
}: {
  initialQuery: string;
  initialProfession?: string;
}) {
  const { t } = useI18n();
  const [filters, setFilters] = useState<JobFilters>({
    q: initialQuery || undefined,
    professions: initialProfession ? [initialProfession] : undefined,
    maxDistanceKm: 25,
  });
  const [view, setView] = useState<ResultsView>("mapList");
  const isDesktop = useIsDesktop();
  const effectiveView = !isDesktop && view === "mapList" ? "list" : view;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [applyJob, setApplyJob] = useState<JobPosting | null>(null);

  const queryFilters: JobFilters = {
    ...filters,
    near: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined,
  };
  const { data: jobs = [], isLoading } = useJobSearch(queryFilters);
  const noResults = !isLoading && jobs.length === 0;

  const patch = (p: Partial<JobFilters>) => setFilters((f) => ({ ...f, ...p }));
  const clear = () => setFilters((f) => ({ q: f.q, maxDistanceKm: 25 }));

  const activeCount =
    (filters.professions?.length ?? 0) +
    (filters.industries?.length ?? 0) +
    (filters.customIndustries?.length ?? 0) +
    (filters.durations?.length ?? 0) +
    (filters.rateMin != null ? 1 : 0);

  const city = userLocation?.city ?? CITY;
  const sidebarProps = {
    filters,
    onPatch: patch,
    onClear: clear,
    userLocation,
    onLocate: setUserLocation,
    onClearLocation: () => setUserLocation(null),
  };
  const sidebar = (
    <div className="hidden lg:block">
      <JobsFilterSidebar {...sidebarProps} variant={effectiveView === "list" ? "full" : "compact"} />
    </div>
  );
  const skeletons = Array.from({ length: 6 }).map((_, i) => <SpecialistCardSkeleton key={i} />);
  const mapCenter: [number, number] | undefined = userLocation ? [userLocation.lng, userLocation.lat] : undefined;

  return (
    <>
      <SearchTopbar category={t("jobs.title")} />

      <main className="mx-auto mb-8 flex w-full max-w-[1280px] flex-1 flex-col gap-4 px-4 pt-6 pb-20 sm:px-8">
        <ResultsToolbar
          title={t("jobs.titleCount", { count: jobs.length, city })}
          subtitle={t("jobs.subtitle")}
          view={effectiveView}
          onView={setView}
          onOpenFilters={() => setFiltersOpen(true)}
          filterCount={activeCount}
        />

        {/* List (also the empty-state fallback for the map views) */}
        {(effectiveView === "list" || noResults) && (
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            {sidebar}
            <div>
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">{skeletons}</div>
              ) : jobs.length === 0 ? (
                <Empty t={t} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {jobs.map((j) => (
                    <JobCard key={j.id} job={j} onApply={() => setApplyJob(j)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map + list (desktop only) */}
        {effectiveView === "mapList" && !noResults && (
          <div className="grid gap-4 lg:h-[calc(100vh-220px)] lg:grid-rows-[minmax(0,1fr)] lg:grid-cols-[200px_minmax(300px,400px)_1fr]">
            {sidebar}
            {/* px room so the selection ring isn't clipped by overflow / doesn't bleed under the filters */}
            <div className="flex flex-col gap-3 overflow-y-auto px-1.5 py-0.5">
              {isLoading
                ? skeletons
                : jobs.map((j) => (
                    <div
                      key={j.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveId(j.id)}
                      className={cn(
                        "rounded-panel transition-shadow",
                        activeId === j.id && "ring-2 ring-ink",
                      )}
                    >
                      <JobCard job={j} onApply={() => setApplyJob(j)} />
                    </div>
                  ))}
            </div>
            <JobsMapView
              jobs={jobs}
              activeId={activeId}
              onSelect={setActiveId}
              onApply={setApplyJob}
              center={mapCenter}
            />
          </div>
        )}

        {/* Map only */}
        {effectiveView === "map" && !noResults && (
          <div className="grid gap-4 lg:h-[calc(100vh-220px)] lg:grid-rows-[minmax(0,1fr)] lg:grid-cols-[200px_1fr]">
            {sidebar}
            <JobsMapView
              jobs={jobs}
              activeId={activeId}
              onSelect={setActiveId}
              onApply={setApplyJob}
              center={mapCenter}
            />
          </div>
        )}
      </main>

      {/* Mobile filters */}
      <Dialog open={filtersOpen} onClose={() => setFiltersOpen(false)} title={t("results.filtersToggle")} size="lg">
        <JobsFilterSidebar {...sidebarProps} variant="full" />
        <Button
          variant="dark"
          onClick={() => setFiltersOpen(false)}
          className="mt-2 w-full rounded-tile py-3 text-sm"
        >
          {t("results.showResultsCount", { count: jobs.length })}
        </Button>
      </Dialog>

      <ApplyDialog key={applyJob?.id ?? "none"} job={applyJob} onClose={() => setApplyJob(null)} />
    </>
  );
}

function Empty({ t }: { t: (k: string) => string }) {
  return (
    <div className="grid min-h-[240px] place-items-center text-center">
      <div>
        <p className="text-sm font-semibold text-ink">{t("jobs.empty")}</p>
        <p className="mt-1 text-[13px] text-ink-3">{t("results.emptyHint")}</p>
      </div>
    </div>
  );
}

function WhenTag({ job }: { job: JobPosting }) {
  const { t } = useI18n();
  if (job.when === "now")
    return <Tag className="bg-success-chip text-success-chip-text">{t("results.cardAvailNow")}</Tag>;
  if (job.when === "week")
    return (
      <Tag className="bg-[#fdf0cf] text-[#8a6400]">
        {job.whenDate ?? t("results.cardAvailWeek")}
      </Tag>
    );
  return <Tag className="bg-pill text-ink-2">{job.whenDate ?? t("results.fAvailDate")}</Tag>;
}

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", className)}>
      {children}
    </span>
  );
}

function JobCard({ job, onApply }: { job: JobPosting; onApply: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col rounded-panel border border-line-3 bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-ink">{job.title}</h3>
        <WhenTag job={job} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
        <span className="rounded-tile bg-pill px-2 py-1 font-medium">{job.profession}</span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-ink-4" />
          {job.district}
          {job.distanceKm ? ` · ${t("results.km", { km: job.distanceKm })}` : ""}
        </span>
      </div>

      <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{job.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-2">
        <span className="inline-flex items-center gap-1 font-bold text-ink">
          <Coins className="h-3.5 w-3.5 text-[#e0a400]" />
          {jobRateLabel(job, t)}
        </span>
        {job.hours > 0 && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-ink-4" />
            {t("jobs.hours", { n: job.hours })}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
        <span className="inline-flex items-center gap-1 text-[12px] text-ink-2">
          {job.employer}
          {job.employerVerified && <BadgeCheck className="h-3.5 w-3.5 text-[#1158ed]" />}
          <span className="text-ink-4">· {job.postedAgo}</span>
        </span>
        <Button variant="dark" onClick={onApply} className="rounded-tile px-4 py-2 text-[13px]">
          {t("jobs.apply")}
        </Button>
      </div>
    </div>
  );
}

function ApplyDialog({ job, onClose }: { job: JobPosting | null; onClose: () => void }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { show } = useToast();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!job || !text.trim()) return;
    setSending(true);
    try {
      await jobsService.apply(job.id, text);
      setSent(true);
    } catch (e) {
      show(requestErrorToast(e, t));
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={!!job} onClose={onClose} title={sent ? undefined : t("jobs.applyTitle")}>
      {!job ? null : sent ? (
        <div className="py-2 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-chip text-success-chip-text">
            <Check className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-lg font-bold text-ink">{t("jobs.applySuccessTitle")}</h2>
          <p className="mt-1 text-sm text-ink-2">{t("jobs.applySuccessDesc")}</p>
          <Button variant="dark" onClick={onClose} className="mt-5 w-full rounded-tile py-3 text-sm">
            {t("contact.done")}
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-tile bg-subtle p-3">
            <p className="text-sm font-semibold text-ink">{job.title}</p>
            <p className="text-[12px] text-ink-3">
              {job.employer} · {job.district} · {t("results.perHour", { rate: job.rate })}
            </p>
          </div>
          {!user ? (
            <div className="mt-4 rounded-tile border border-line-2 p-4 text-center">
              <p className="text-sm text-ink-2">{t("jobs.applyLoginRequired")}</p>
              <a
                href="/login"
                className="mt-3 inline-flex w-full items-center justify-center rounded-tile bg-ink px-4 py-2.5 text-sm font-bold text-on-dark hover:bg-ink/90"
              >
                {t("contact.loginCta")}
              </a>
            </div>
          ) : !user.emailVerified ? (
            <VerifyNotice variant="panel" message={t("verify.noticeContact")} className="mt-4" />
          ) : user.role !== "specialist" ? (
            <div className="mt-4 rounded-tile border border-line-2 bg-muted p-4 text-center text-[13px] text-ink-2">
              {t("jobs.applySpecialistsOnly")}
            </div>
          ) : (
            <>
              <label className="mb-1.5 mt-4 block text-[12px] font-semibold text-ink-3">
                {t("jobs.applyMessageLabel")}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder={t("jobs.applyPlaceholder")}
                className="w-full resize-y rounded-tile border border-line-2 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink placeholder:text-ink-4"
              />
              <Button
                variant="gradient"
                onClick={send}
                disabled={sending}
                className="mt-3 w-full rounded-tile py-3 text-sm"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("jobs.applySending")}
                  </>
                ) : (
                  t("jobs.applySend")
                )}
              </Button>
            </>
          )}
        </>
      )}
    </Dialog>
  );
}
