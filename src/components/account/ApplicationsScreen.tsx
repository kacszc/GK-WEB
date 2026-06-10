"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Send, MapPin, Coins } from "lucide-react";
import { applicationsService, type MyApplication } from "@/services";
import { jobRateLabel } from "@/lib/jobRate";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

/** Specialist-side: the jobs I've applied to, with status. */
export function ApplicationsScreen() {
  const { t, locale } = useI18n();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["myApplications", locale],
    queryFn: () => applicationsService.getMine(locale),
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("applications.title")}</h1>
        <p className="mt-1 text-[13px] text-ink-3">{t("applications.subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="skeleton h-24 rounded-panel" />
      ) : items.length === 0 ? (
        <div className="grid min-h-[160px] place-items-center rounded-panel border border-dashed border-line-2 text-center">
          <div>
            <Send className="mx-auto h-7 w-7 text-ink-4" />
            <p className="mt-2 text-sm text-ink-3">{t("applications.empty")}</p>
            <Link href="/jobs" className="mt-3 inline-block text-[13px] font-semibold text-brand-violet hover:underline">
              {t("applications.browse")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-panel border border-line-3 bg-surface p-4">
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-ink">{a.title}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-2">
                  <span className="rounded-tile bg-pill px-2 py-0.5 font-medium">{a.profession}</span>
                  {a.district && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-ink-4" />
                      {a.district}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 font-semibold text-ink">
                    <Coins className="h-3.5 w-3.5 text-[#e0a400]" />
                    {jobRateLabel({ rate: a.rateFrom, rateDisclosed: a.rateDisclosed, currency: a.currency }, t)}
                  </span>
                </p>
              </div>
              <StatusBadge status={a.status} t={t} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, t }: { status: MyApplication["status"]; t: (k: string) => string }) {
  const map: Record<string, { key: string; cls: string }> = {
    APPLIED: { key: "applications.statusApplied", cls: "bg-[#fdf0cf] text-[#8a6400]" },
    SELECTED: { key: "applications.statusSelected", cls: "bg-success-chip text-success-chip-text" },
    REJECTED: { key: "applications.statusRejected", cls: "bg-pill text-ink-3" },
  };
  const s = map[status] ?? map.APPLIED;
  return (
    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold", s.cls)}>{t(s.key)}</span>
  );
}
