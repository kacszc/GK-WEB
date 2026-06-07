"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Download, Calendar, Star } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { CompareModal } from "@/components/reports/CompareModal";
import { reportsService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { printArea } from "@/lib/print";
import { cn } from "@/lib/cn";

export function ReportsScreen() {
  const { t } = useI18n();
  const [grain, setGrain] = useState<"weekly" | "monthly" | "quarterly">("monthly");
  const [compareOpen, setCompareOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useQuery({ queryKey: ["reports"], queryFn: reportsService.getReports });

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 rounded-tile" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-tile" />
            <Skeleton className="h-9 w-28 rounded-tile" />
          </div>
        </div>
        {/* KPI row of 4 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-24 border border-line-3" />
          ))}
        </div>
        {/* Chart + side column */}
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <SkeletonCard className="h-72 border border-line-3" />
          <SkeletonCard className="h-72 border border-line-3" />
        </div>
        {/* Table */}
        <SkeletonCard className="h-64 border border-line-3" />
      </div>
    );
  }

  const maxBar = Math.max(1, ...data.hiresOverTime.map((b) => b.value));

  return (
    <div ref={printRef} className="flex flex-col gap-5">
      <CompareModal candidates={data.history} open={compareOpen} onClose={() => setCompareOpen(false)} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("reports.title")}</h1>
          <p className="mt-1 max-w-xl text-[13px] text-ink-3">{t("reports.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <span className="inline-flex items-center gap-1.5 rounded-tile border border-line-2 px-3 py-2 text-[13px] text-ink-2">
            <Calendar className="h-3.5 w-3.5 text-ink-4" />
            {t("reports.range")}
          </span>
          <Button variant="dark" onClick={() => printArea(printRef.current)} className="rounded-tile px-4 py-2 text-[13px]">
            <Download className="h-4 w-4" />
            {t("reports.export")}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.kpis.map((k) => (
          <div key={k.id} className="rounded-panel border border-line-3 bg-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-ink-4">{k.label}</p>
            <p className="mt-2 text-3xl font-bold text-ink">{k.value}</p>
            {k.delta && <p className="mt-1 text-[12px] font-medium text-success">{k.delta}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Bar chart */}
        <div className="rounded-panel border border-line-3 bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-ink">{t("reports.hiresOverTime")}</h2>
            <div className="flex gap-1 rounded-full bg-pill p-0.5">
              {(["weekly", "monthly", "quarterly"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGrain(g)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                    grain === g ? "bg-surface text-ink shadow-sm" : "text-ink-3",
                  )}
                >
                  {t(`reports.${g}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex h-52 items-end justify-around gap-3">
            {data.hiresOverTime.map((b) => (
              <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[13px] font-semibold text-ink">{b.value}</span>
                <div
                  className="w-full max-w-[48px] rounded-t-tile bg-ink transition-all"
                  style={{ height: `${(b.value / maxBar) * 160}px` }}
                />
                <span className="text-[12px] text-ink-4">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Who uses + compare */}
        <div className="flex flex-col gap-4">
          <div className="rounded-panel border border-line-3 bg-surface p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.5px] text-ink-4">{t("reports.whoUses")}</p>
            <ul className="flex flex-col gap-3">
              {data.history.slice(0, 3).map((h) => (
                <li key={h.id} className="flex items-center gap-2.5">
                  <Avatar name={h.name} index={h.avatarIndex} size={32} />
                  <span className="text-[13px] font-medium text-ink">{h.name}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-panel bg-ink p-4 text-on-dark">
            <p className="text-sm font-bold">{t("reports.compareTitle")}</p>
            <p className="mt-1 text-[12px] text-on-dark/70">{t("reports.compareDesc")}</p>
            <Button variant="white" onClick={() => setCompareOpen(true)} className="mt-3 w-full rounded-tile py-2.5 text-[13px]">
              {t("reports.compareCta")}
            </Button>
          </div>
        </div>
      </div>

      {/* Hire history table */}
      <div className="rounded-panel border border-line-3 bg-surface p-5">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">{t("reports.historyTitle", { n: 47 })}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.5px] text-ink-4">
                <th className="pb-2 font-semibold">{t("reports.colWorker")}</th>
                <th className="pb-2 font-semibold">{t("reports.colJob")}</th>
                <th className="pb-2 font-semibold">{t("reports.colDate")}</th>
                <th className="pb-2 font-semibold">{t("reports.colRate")}</th>
                <th className="pb-2 font-semibold">{t("reports.colRating")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.history.map((h) => (
                <tr key={h.id}>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={h.name} index={h.avatarIndex} size={30} />
                      <div>
                        <p className="font-semibold text-ink">{h.name}</p>
                        <p className="text-[11px] text-ink-4">Trust {h.trustScore}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-ink-2">{h.job}</td>
                  <td className="py-2.5 text-ink-3">{h.date}</td>
                  <td className="py-2.5 font-medium text-ink">{h.rate} zł</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-0.5 text-[#e0a400]">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {h.rating.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enterprise insights */}
      <div className="rounded-panel border border-line-3 bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">{t("reports.insightsTitle")}</h2>
            <p className="mt-0.5 text-[12px] text-ink-3">{t("reports.insightsSub")}</p>
          </div>
          <span className="rounded-full bg-brand-violet px-2.5 py-1 text-[11px] font-bold text-on-dark">{t("reports.enterprise")}</span>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Funnel */}
          <div>
            <p className="mb-3 text-[13px] font-semibold text-ink">{t("reports.funnelTitle")}</p>
            <ul className="flex flex-col gap-2">
              {data.funnel.map((f) => (
                <li key={f.label}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="text-ink-2">{f.label}</span>
                    <span className="font-semibold text-ink">{f.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-pill">
                    <div className="h-full rounded-full bg-brand-violet" style={{ width: `${f.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {/* Scorecard */}
          <div>
            <p className="mb-3 text-[13px] font-semibold text-ink">{t("reports.scorecardTitle")}</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-panel border border-line-3 p-3">
                <span className="text-[13px] text-ink-2">{t("reports.repeatHire")}</span>
                <span className="text-xl font-bold text-success">{data.repeatHireRate}%</span>
              </div>
              <Link
                href="/account/disputes"
                className="flex items-center justify-between rounded-panel border border-line-3 p-3 transition-colors hover:bg-muted"
              >
                <span className="text-[13px] text-ink-2">{t("reports.disputes")}</span>
                <span className="text-xl font-bold text-ink">{data.disputesOpened}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
