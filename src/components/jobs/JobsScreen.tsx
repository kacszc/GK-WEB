"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Coins, BadgeCheck, Loader2 } from "lucide-react";
import { SearchTopbar } from "@/components/search/SearchTopbar";
import { ResultsToolbar, type ResultsView } from "@/components/search/ResultsToolbar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { SpecialistCardSkeleton } from "@/components/search/SpecialistCard";
import { Pagination } from "@/components/search/Pagination";
import { JobsFilterSidebar } from "./JobsFilterSidebar";
import { JobsMapView } from "./JobsMapView";
import { ApplyDialog } from "./ApplyDialog";
import { useJobSearch } from "@/hooks/useJobSearch";
import type { JobFilters } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { jobRateLabel } from "@/lib/jobRate";
import { cn } from "@/lib/cn";
import type { JobPosting, UserLocation } from "@/lib/types";

const CITY = "Warszawa";
const PAGE_SIZE = 12;
const MAP_BATCH = 200; // map views fetch a single larger batch so most pins render at once

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
  initialIndustry,
  initialLocation = null,
  initialMaxDistanceKm,
  initialFromDate,
  initialToDate,
}: {
  initialQuery: string;
  initialProfession?: string;
  /** Whole-industry pre-filter (branża code) — used when only the industry is known (mini interview). */
  initialIndustry?: string;
  initialLocation?: UserLocation | null;
  initialMaxDistanceKm?: number;
  initialFromDate?: string;
  initialToDate?: string;
}) {
  const { t } = useI18n();
  // No distance cap by default → "Proponowane" (everyone). A limit applies only once the user sets it
  // (or when the landing carried a city + radius).
  const [filters, setFilters] = useState<JobFilters>({
    q: initialQuery || undefined,
    professions: initialProfession ? [initialProfession] : undefined,
    industries: initialIndustry ? [initialIndustry] : undefined,
    maxDistanceKm: initialMaxDistanceKm,
    fromDate: initialFromDate,
    toDate: initialToDate,
  });
  const [view, setView] = useState<ResultsView>("mapList");
  const isDesktop = useIsDesktop();
  const effectiveView = !isDesktop && view === "mapList" ? "list" : view;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(initialLocation);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [applyJob, setApplyJob] = useState<JobPosting | null>(null);
  const [page, setPage] = useState(1);

  // Server-side pagination: list fetches one page; map views fetch a larger batch for the pins.
  const isListView = effectiveView === "list";
  const queryFilters: JobFilters = {
    ...filters,
    near: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined,
    page: isListView ? page - 1 : 0,
    size: isListView ? PAGE_SIZE : MAP_BATCH,
  };
  const { data, isLoading } = useJobSearch(queryFilters);
  const jobs = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const patch = (p: Partial<JobFilters>) => {
    setFilters((f) => ({ ...f, ...p }));
    setPage(1);
  };
  const clear = () => {
    setFilters((f) => ({ q: f.q }));
    setPage(1);
  };

  const activeCount =
    (filters.professions?.length ?? 0) +
    (filters.industries?.length ?? 0) +
    (filters.customIndustries?.length ?? 0) +
    (filters.durations?.length ?? 0) +
    (filters.rateMin != null ? 1 : 0) +
    (filters.fromDate ? 1 : 0);

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
          title={t("jobs.titleCount", { count: total, city })}
          subtitle={t("jobs.subtitle")}
          view={effectiveView}
          onView={setView}
          onOpenFilters={() => setFiltersOpen(true)}
          filterCount={activeCount}
        />

        {/* List view (map views stay on the map and show an empty overlay instead of falling back). */}
        {effectiveView === "list" && (
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            {sidebar}
            <div>
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">{skeletons}</div>
              ) : jobs.length === 0 ? (
                <Empty t={t} />
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {jobs.map((j) => (
                      <JobCard key={j.id} job={j} onApply={() => setApplyJob(j)} />
                    ))}
                  </div>
                  <div className="mt-8">
                    <Pagination page={page} pageCount={pageCount} onPage={setPage} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Map + list (desktop only). Empty → overlay on the map. */}
        {effectiveView === "mapList" && (
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
            <div className="relative h-full">
              <JobsMapView
                jobs={jobs}
                activeId={activeId}
                onSelect={setActiveId}
                onApply={setApplyJob}
                center={mapCenter}
              />
              {(isLoading || total === 0) && <MapEmptyOverlay t={t} loading={isLoading} />}
            </div>
          </div>
        )}

        {/* Map only. Empty → overlay on the map. */}
        {effectiveView === "map" && (
          <div className="grid gap-4 lg:h-[calc(100vh-220px)] lg:grid-rows-[minmax(0,1fr)] lg:grid-cols-[200px_1fr]">
            {sidebar}
            <div className="relative h-full">
              <JobsMapView
                jobs={jobs}
                activeId={activeId}
                onSelect={setActiveId}
                onApply={setApplyJob}
                center={mapCenter}
              />
              {(isLoading || total === 0) && <MapEmptyOverlay t={t} loading={isLoading} />}
            </div>
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

/** Overlay on top of the map while loading or when there are no results. Captures pointer events so
 *  the empty/loading map can't be panned underneath; removed once results exist (map interactive). */
function MapEmptyOverlay({ t, loading = false }: { t: (k: string) => string; loading?: boolean }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center rounded-card bg-surface/70 px-4 text-center backdrop-blur-[2px]">
      <div className="rounded-panel border border-line-3 bg-surface/95 px-5 py-4 shadow-search">
        {loading ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-violet" />
        ) : (
          <>
            <p className="text-sm font-semibold text-ink">{t("jobs.empty")}</p>
            <p className="mt-1 text-[13px] text-ink-3">{t("results.emptyHint")}</p>
          </>
        )}
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

/** Tiny company logo (or initial fallback) shown next to the employer name on a job card. */
function CompanyBadge({ logoUrl, name }: { logoUrl?: string | null; name: string }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={20}
        height={20}
        unoptimized
        className="h-5 w-5 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-pill text-[10px] font-bold text-ink-3">
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

function JobCard({ job, onApply }: { job: JobPosting; onApply: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col rounded-panel border border-line-3 bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/jobs/${job.id}`} className="text-[15px] font-semibold text-ink hover:underline">
          {job.title}
        </Link>
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
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] text-ink-2">
          <CompanyBadge logoUrl={job.employerLogoUrl} name={job.employer} />
          {job.employerId ? (
            <Link href={`/employer/${job.employerId}`} className="truncate font-medium text-ink hover:underline">
              {job.employer}
            </Link>
          ) : (
            <span className="truncate">{job.employer}</span>
          )}
          {job.employerVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#1158ed]" />}
          <span className="shrink-0 text-ink-4">· {job.postedAgo}</span>
        </span>
        <Button variant="dark" onClick={onApply} className="shrink-0 rounded-tile px-4 py-2 text-[13px]">
          {t("jobs.apply")}
        </Button>
      </div>
    </div>
  );
}

