"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users } from "lucide-react";
import { accountService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { MyJobStatus } from "@/lib/types";

const statusStyle: Record<MyJobStatus, string> = {
  active: "bg-success-chip text-success-chip-text",
  filled: "bg-[#e7efff] text-[#1158ed]",
  expired: "bg-pill text-ink-3",
};
const statusKey: Record<MyJobStatus, string> = {
  active: "account.statusActive",
  filled: "account.statusFilled",
  expired: "account.statusExpired",
};

export function MyJobsList() {
  const { t } = useI18n();
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["myJobs"],
    queryFn: accountService.getMyJobs,
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("account.jobsTitle")}</h1>

      {isLoading ? (
        <Skeletons />
      ) : jobs.length === 0 ? (
        <Empty>
          <p className="text-sm font-semibold text-ink">{t("account.jobsEmpty")}</p>
          <Link
            href="/post-job"
            className="mt-3 inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-bold text-on-dark"
          >
            {t("account.postFirst")}
          </Link>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="flex flex-col gap-3 rounded-panel border border-line-3 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold text-ink">{j.title}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", statusStyle[j.status])}>
                    {t(statusKey[j.status])}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-2">
                  <span>{j.profession}</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-ink-4" />
                    {j.district}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-ink-4" />
                    {t("account.applicants", { n: j.applicants })}
                  </span>
                  <span className="text-ink-4">· {j.postedAgo}</span>
                </div>
              </div>
              <Link
                href={`/account/jobs/${j.id}`}
                className="inline-flex shrink-0 items-center justify-center rounded-tile border border-line-2 bg-surface px-4 py-2 text-[13px] font-medium text-ink hover:bg-muted"
              >
                {t("account.viewApplicants")}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Skeletons() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton h-20 rounded-panel" />
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[200px] place-items-center rounded-panel border border-dashed border-line-2 text-center">
      <div>{children}</div>
    </div>
  );
}
