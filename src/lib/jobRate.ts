import type { JobPosting } from "@/lib/types";

type T = (key: string, params?: Record<string, string | number>) => string;

/**
 * Display label for a job's pay: "to be agreed" when withheld, otherwise the hourly rate with its
 * currency (jobs may be priced in PLN/EUR/… — not assumed to be złoty).
 */
export function jobRateLabel(
  job: Pick<JobPosting, "rate" | "rateDisclosed" | "currency">,
  t: T,
): string {
  if (job.rateDisclosed === false) return t("jobs.rateToAgree");
  return t("jobs.rateFromCur", { rate: job.rate, cur: job.currency || "PLN" });
}
