"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Clock, Coins, BadgeCheck, Check, Loader2 } from "lucide-react";
import { SearchTopbar } from "@/components/search/SearchTopbar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { SpecialistCardSkeleton } from "@/components/search/SpecialistCard";
import { useJobSearch } from "@/hooks/useJobSearch";
import { catalogService, jobsService, type JobFilters } from "@/services";
import { warsawDistricts } from "@/services/warsaw-districts";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/AuthProvider";
import { cn } from "@/lib/cn";
import type { JobPosting, Availability } from "@/lib/types";

const CITY = "Warszawa";
const AVAIL: Availability[] = ["now", "week", "date"];
const AVAIL_KEY: Record<Availability, string> = {
  now: "results.fAvailNow",
  week: "results.fAvailWeek",
  date: "results.fAvailDate",
};

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
    profession: initialProfession || undefined,
  });
  const [applyJob, setApplyJob] = useState<JobPosting | null>(null);

  const { data: jobs = [], isLoading } = useJobSearch(filters);
  const { data: professions = [] } = useQuery({
    queryKey: ["professions"],
    queryFn: () => catalogService.getPopularProfessions(),
  });

  const patch = (p: Partial<JobFilters>) => setFilters((f) => ({ ...f, ...p }));
  const toggleWhen = (a: Availability) => {
    const set = new Set(filters.when ?? []);
    if (set.has(a)) set.delete(a);
    else set.add(a);
    patch({ when: [...set] });
  };

  const selectCls =
    "rounded-tile border border-line-2 bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-ink cursor-pointer";

  return (
    <>
      <SearchTopbar category={t("jobs.title")} />

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-5 px-4 pt-6 pb-20 sm:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">
            {t("jobs.titleCount", { count: jobs.length, city: CITY })}
          </h1>
          <p className="mt-1 text-[13px] text-ink-3">{t("jobs.subtitle")}</p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-tile border border-line-2 bg-surface px-3">
            <Search className="h-4 w-4 text-ink-4" />
            <input
              value={filters.q ?? ""}
              onChange={(e) => patch({ q: e.target.value || undefined })}
              placeholder={t("jobs.searchPlaceholder")}
              className="w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-4"
            />
          </div>
          <select
            value={filters.profession ?? ""}
            onChange={(e) => patch({ profession: e.target.value || undefined })}
            className={selectCls}
          >
            <option value="">{t("jobs.allProfessions")}</option>
            {professions.map((p) => (
              <option key={p.code ?? p.label} value={p.code ?? p.label}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={filters.district ?? ""}
            onChange={(e) => patch({ district: e.target.value || undefined })}
            className={selectCls}
          >
            <option value="">{t("jobs.allDistricts")}</option>
            {warsawDistricts.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5">
            {AVAIL.map((a) => (
              <button
                key={a}
                onClick={() => toggleWhen(a)}
                className={cn(
                  "rounded-full border px-3 py-2 text-[13px] font-medium transition-colors",
                  filters.when?.includes(a)
                    ? "border-ink bg-ink text-on-dark"
                    : "border-line-2 text-ink hover:bg-muted",
                )}
              >
                {t(AVAIL_KEY[a])}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SpecialistCardSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="grid min-h-[240px] place-items-center text-center">
            <div>
              <p className="text-sm font-semibold text-ink">{t("jobs.empty")}</p>
              <p className="mt-1 text-[13px] text-ink-3">{t("results.emptyHint")}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} onApply={() => setApplyJob(j)} />
            ))}
          </div>
        )}
      </main>

      <ApplyDialog key={applyJob?.id ?? "none"} job={applyJob} onClose={() => setApplyJob(null)} />
    </>
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
          {t("results.perHour", { rate: job.rate })}
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
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!job || !text.trim()) return;
    setSending(true);
    try {
      await jobsService.apply(job.id, text);
      setSent(true);
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
