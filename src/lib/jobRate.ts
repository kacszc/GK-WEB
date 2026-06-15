import type { JobPosting, JobRateType } from "@/lib/types";

type T = (key: string, params?: Record<string, string | number>) => string;

/** Pay-model suffix appended after the amount, e.g. "/h", "/mies.", "/dzień", " / zlecenie". */
export function rateUnitSuffix(rateType: JobRateType | undefined, t: T): string {
  return t(`jobs.rateUnit.${rateType ?? "hourly"}`);
}

/**
 * Display label for a job's pay: "to be agreed" when withheld; otherwise the amount (a single "od X"
 * value or an "X–Y" range) in its currency (PLN/EUR/…) with the pay-model suffix (hourly/monthly/
 * per-job/daily).
 */
export function jobRateLabel(
  job: Pick<JobPosting, "rate" | "rateDisclosed" | "currency" | "rateType" | "rateTo">,
  t: T,
): string {
  if (job.rateDisclosed === false) return t("jobs.rateToAgree");
  const cur = job.currency || "PLN";
  const unit = rateUnitSuffix(job.rateType, t);
  if (job.rateTo != null && job.rateTo > job.rate) {
    return `${job.rate}–${job.rateTo} ${cur}${unit}`;
  }
  return t("jobs.rateFromCur", { rate: job.rate, cur, unit });
}
