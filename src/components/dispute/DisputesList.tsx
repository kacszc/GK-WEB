"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Scale, ChevronRight } from "lucide-react";
import { disputesService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

/** Current user's disputes — entry point to each mediation case. */
export function DisputesList() {
  const { t } = useI18n();
  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ["disputes"],
    queryFn: disputesService.getMyDisputes,
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("dispute.listTitle")}</h1>
        <p className="mt-1 text-sm text-ink-3">{t("dispute.listSubtitle")}</p>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-panel" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <div className="grid min-h-[200px] place-items-center gap-2 rounded-panel border border-dashed border-line-2 text-center">
          <Scale className="h-7 w-7 text-ink-4" />
          <p className="text-sm text-ink-3">{t("dispute.listEmpty")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-panel border border-line-3 bg-surface">
          {disputes.map((d) => (
            <Link
              key={d.id}
              href={`/account/disputes/${d.id}`}
              className="flex items-center gap-3 border-b border-line px-4 py-3.5 transition-colors last:border-b-0 hover:bg-muted"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pill text-ink-3">
                <Scale className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{d.reasonLabel}</p>
                <p className="text-[12px] text-ink-4">{t("dispute.openedAt", { date: d.openedAt })}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold",
                  d.status === "resolved" ? "bg-success-badge text-on-dark" : "bg-[#fdf6e3] text-[#8a6400]",
                )}
              >
                {d.status === "resolved" ? t("dispute.statusResolved") : t("dispute.statusOpen")}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-4" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
