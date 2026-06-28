"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Coins, Clock, BadgeCheck, CalendarDays, ClipboardCheck } from "lucide-react";
import { SearchTopbar } from "@/components/search/SearchTopbar";
import { Button } from "@/components/ui/Button";
import { ApplyDialog } from "./ApplyDialog";
import { jobsService } from "@/services";
import { jobRateLabel } from "@/lib/jobRate";
import { useI18n } from "@/i18n/I18nProvider";

/** Public single-job page (job-seeker view): full offer details + apply. */
export function JobDetailPublic({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const [applyOpen, setApplyOpen] = useState(false);
  const { data: job, isLoading, isError } = useQuery({
    queryKey: ["jobPublic", id, locale],
    queryFn: () => jobsService.getById(id, locale),
    retry: false,
  });

  return (
    <>
      <SearchTopbar category={t("jobs.title")} />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-8 sm:px-8">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-ink-2 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("employer.backToJobs")}
        </Link>

        {isLoading ? (
          <div className="mt-6 skeleton h-80 rounded-panel" />
        ) : isError || !job ? (
          <div className="mt-10 grid place-items-center text-center">
            <div>
              <p className="text-sm font-semibold text-ink">{t("jobs.notFound")}</p>
              <Link href="/jobs" className="mt-4 inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-on-dark hover:bg-ink/90">
                {t("employer.backToJobs")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-panel border border-line-3 bg-surface p-6 sm:p-7">
            <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{job.title}</h1>

            {/* Company row → links to the employer profile. */}
            <div className="mt-3 flex items-center gap-2">
              {job.employerLogoUrl ? (
                <Image src={job.employerLogoUrl} alt={job.employer} width={28} height={28} unoptimized className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-pill text-[12px] font-bold text-ink-3">
                  {(job.employer || "?").charAt(0).toUpperCase()}
                </span>
              )}
              {job.employerId ? (
                <Link href={`/employer/${job.employerId}`} className="text-sm font-medium text-ink hover:underline">
                  {job.employer}
                </Link>
              ) : (
                <span className="text-sm font-medium text-ink">{job.employer}</span>
              )}
              {job.employerVerified && <BadgeCheck className="h-4 w-4 text-[#1158ed]" />}
              <span className="text-[12px] text-ink-4">· {job.postedAgo}</span>
            </div>

            {/* Key facts */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-2">
              <span className="inline-flex items-center gap-1.5 font-bold text-ink">
                <Coins className="h-4 w-4 text-[#e0a400]" />
                {jobRateLabel(job, t)}
              </span>
              {job.district && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-ink-4" />
                  {job.district}
                  {job.distanceKm ? ` · ${t("results.km", { km: job.distanceKm })}` : ""}
                </span>
              )}
              {job.hours > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-ink-4" />
                  {t("jobs.hours", { n: job.hours })}
                </span>
              )}
              {job.profession && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-ink-4" />
                  {job.profession}
                </span>
              )}
            </div>

            {job.description && (
              <p className="mt-5 whitespace-pre-line text-[14px] leading-relaxed text-ink-2">{job.description}</p>
            )}

            {/* Optional requirements the employer set — shown before applying. */}
            {(job.requirements?.length ?? 0) > 0 && (
              <div className="mt-6 rounded-tile border border-line-2 bg-subtle p-4">
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-3">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  {t("jobs.requirementsTitle")}
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {job.requirements!.map((r) => (
                    <li key={r.key} className="flex items-center gap-2 text-[13px] text-ink-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-4" />
                      {r.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              variant="gradient"
              onClick={() => setApplyOpen(true)}
              className="mt-6 w-full rounded-tile py-3 text-sm sm:w-auto sm:px-8"
            >
              {t("jobs.apply")}
            </Button>
          </div>
        )}
      </main>

      <ApplyDialog job={applyOpen && job ? job : null} onClose={() => setApplyOpen(false)} />
    </>
  );
}
