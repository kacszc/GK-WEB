"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, AlertTriangle } from "lucide-react";
import { reviewsService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { Review } from "@/lib/types";
import type { ReviewSubjectKind } from "./ReviewDialog";

/** Incident-flag code → i18n label key (flags weigh more than stars; shown as warning chips). */
const FLAG_KEY: Record<string, string> = {
  NO_SHOW: "reviewFlags.noShow",
  WORK_NOT_AS_DESCRIBED: "reviewFlags.workNotAsDescribed",
  LATE_PAYMENT: "reviewFlags.latePayment",
  CONDITIONS_DIFFERENT: "reviewFlags.conditionsDifferent",
};

type SortKey = "newest" | "oldest" | "best" | "worst";
const SORTS: SortKey[] = ["newest", "oldest", "best", "worst"];
const SORT_KEY: Record<SortKey, string> = {
  newest: "reviews.sortNewest",
  oldest: "reviews.sortOldest",
  best: "reviews.sortBest",
  worst: "reviews.sortWorst",
};

/**
 * Reviews block for a detail screen: a summary (average + rating distribution), a sort control
 * (newest / oldest / best / worst) and the list of reviews with per-category scores, incident flags
 * and the subject's reply. The category labels follow the direction (worker vs employer review).
 */
export function ReviewsSection({
  subjectId,
  subjectKind,
}: {
  subjectId: string;
  subjectKind: ReviewSubjectKind;
}) {
  const { t } = useI18n();
  const [sort, setSort] = useState<SortKey>("newest");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", subjectId],
    queryFn: () => reviewsService.listForSubject(subjectId),
  });

  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  // Backend returns newest-first; index order is the "newest" sort.
  const sorted = useMemo(() => {
    const arr = [...reviews];
    switch (sort) {
      case "oldest":
        return arr.reverse();
      case "best":
        return arr.sort((a, b) => b.rating - a.rating);
      case "worst":
        return arr.sort((a, b) => a.rating - b.rating);
      default:
        return arr;
    }
  }, [reviews, sort]);

  const distribution = useMemo(
    () => [5, 4, 3, 2, 1].map((star) => ({ star, n: reviews.filter((r) => Math.round(r.rating) === star).length })),
    [reviews],
  );

  if (isLoading) {
    return <div className="skeleton h-48 rounded-panel" />;
  }
  if (count === 0) {
    return null;
  }

  return (
    <section className="rounded-panel border border-line-3 bg-surface p-5">
      <h2 className="text-[15px] font-semibold text-ink">
        {t("reviews.title")} · {t("profile.reviewsCount", { count })}
      </h2>

      {/* Summary: big average + star distribution bars. */}
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex shrink-0 flex-col items-center sm:w-28">
          <span className="text-4xl font-bold text-ink">{avg.toFixed(1)}</span>
          <div className="mt-1 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={cn("h-3.5 w-3.5", n <= Math.round(avg) ? "fill-current text-[#e0a400]" : "text-line-4")}
              />
            ))}
          </div>
          <span className="mt-1 text-[12px] text-ink-3">{t("profile.reviewsCount", { count })}</span>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          {distribution.map(({ star, n }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="flex w-6 shrink-0 items-center gap-0.5 text-[12px] text-ink-3">
                {star}
                <Star className="h-3 w-3 fill-current text-[#e0a400]" />
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-pill">
                <div
                  className="h-full rounded-full bg-[#e0a400]"
                  style={{ width: `${count > 0 ? (n / count) * 100 : 0}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-[12px] text-ink-3">{n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sort control. */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {SORTS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setSort(k)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
              sort === k ? "border-ink bg-ink text-on-dark" : "border-line-2 text-ink-2 hover:bg-muted",
            )}
          >
            {t(SORT_KEY[k])}
          </button>
        ))}
      </div>

      {/* List. */}
      <div className="mt-4 flex flex-col gap-3">
        {sorted.map((r, i) => (
          <ReviewItem key={r.id ?? i} r={r} subjectKind={subjectKind} t={t} />
        ))}
      </div>
    </section>
  );
}

function ReviewItem({
  r,
  subjectKind,
  t,
}: {
  r: Review;
  subjectKind: ReviewSubjectKind;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  const cats =
    subjectKind === "worker"
      ? ([
          ["reviewCats.punctuality", r.punctuality],
          ["reviewCats.quality", r.quality],
          ["reviewCats.communication", r.communication],
        ] as const)
      : ([
          ["reviewCats.payment", r.payment],
          ["reviewCats.conditions", r.conditions],
          ["reviewCats.communication", r.communication],
        ] as const);
  const shownCats = cats.filter(([, v]) => !!v);

  return (
    <div className="rounded-tile border border-line-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{r.author}</span>
        <span className="inline-flex items-center gap-1 text-[12px] text-ink-2">
          <Star className="h-3.5 w-3.5 fill-current text-[#e0a400]" />
          {r.rating.toFixed(1)}
        </span>
      </div>

      {shownCats.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-3">
          {shownCats.map(([key, v]) => (
            <span key={key} className="inline-flex items-center gap-1">
              {t(key)}
              <span className="inline-flex items-center gap-0.5 font-semibold text-ink-2">
                <Star className="h-3 w-3 fill-current text-[#e0a400]" />
                {Number(v).toFixed(1)}
              </span>
            </span>
          ))}
        </div>
      )}

      {(r.flags?.length ?? 0) > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {r.flags!.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 rounded-tile bg-[#fdecec] px-2 py-1 text-[11px] font-medium text-[#c0322b]"
            >
              <AlertTriangle className="h-3 w-3" />
              {t(FLAG_KEY[f] ?? f)}
            </span>
          ))}
        </div>
      )}

      {r.text && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{r.text}</p>}
      <p className="mt-2 text-[11px] text-ink-4">{r.date}</p>

      {r.reply && (
        <div className="mt-3 rounded-tile bg-muted p-3">
          <p className="text-[11px] font-semibold text-ink-3">{t("profile.reviewReply")}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{r.reply}</p>
        </div>
      )}
    </div>
  );
}
