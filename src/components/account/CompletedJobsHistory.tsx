"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, CheckCircle2, Star } from "lucide-react";
import { accountService } from "@/services";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { useI18n } from "@/i18n/I18nProvider";
import type { CompletedJobHistory } from "@/lib/types";

/**
 * Completed-jobs history for both roles. Each row shows the counterparty + when it finished, and —
 * when the current user hasn't reviewed it yet — a "rate" action that opens the two-sided review
 * dialog with the right direction (employer → worker, specialist → employer).
 */
export function CompletedJobsHistory() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [reviewing, setReviewing] = useState<CompletedJobHistory | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["completedHistory"],
    queryFn: accountService.getCompletedHistory,
  });

  function formatDate(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("history.title")}</h1>
        <p className="mt-1 text-[13px] text-ink-3">{t("history.subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="skeleton h-40 rounded-panel" />
      ) : items.length === 0 ? (
        <div className="grid min-h-[160px] place-items-center rounded-panel border border-dashed border-line-2 text-center">
          <div>
            <Briefcase className="mx-auto h-7 w-7 text-ink-4" />
            <p className="mt-2 text-sm text-ink-3">{t("history.empty")}</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-panel border border-line-3 bg-surface">
          {items.map((it, i) => (
            <div
              key={it.jobId}
              className={`flex min-w-0 items-center gap-3 px-3 py-3.5 sm:px-4 ${i > 0 ? "border-t border-line" : ""}`}
            >
              <Avatar name={it.counterpartyName ?? "?"} index={i} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{it.title}</p>
                <p className="truncate text-[12px] text-ink-3">
                  {it.counterpartyName ?? t("history.counterpartyFallback")}
                  {it.completedAt ? ` · ${t("history.doneOn", { date: formatDate(it.completedAt) })}` : ""}
                </p>
              </div>
              {it.reviewed ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-chip px-2.5 py-1 text-[11px] font-semibold text-success-chip-text">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("history.rated")}
                </span>
              ) : it.counterpartyId ? (
                <Button
                  variant="outline"
                  onClick={() => setReviewing(it)}
                  className="shrink-0 rounded-tile px-3.5 py-2 text-[12px]"
                >
                  <Star className="h-3.5 w-3.5" />
                  {t("history.rate")}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {reviewing && reviewing.counterpartyId && (
        <ReviewDialog
          open={!!reviewing}
          jobId={reviewing.jobId}
          subjectId={reviewing.counterpartyId}
          subjectKind={reviewing.subjectKind}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null);
            queryClient.invalidateQueries({ queryKey: ["completedHistory"] });
          }}
        />
      )}
    </div>
  );
}
