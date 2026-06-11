import { apiGet, apiPost } from "@/lib/api-client";

/** A specialist's own job application (their history). */
export type MyApplication = {
  id: string;
  jobId: string;
  title: string;
  profession: string; // localized label
  district: string;
  employerId: string;
  employer: string;
  employerVerified: boolean;
  rateFrom: number;
  rateDisclosed: boolean;
  currency: string;
  jobStatus: string; // ACTIVE / FILLED / COMPLETED / EXPIRED
  status: string; // APPLIED / SELECTED / REJECTED / WITHDRAWN
  appliedAt: string;
  withdrawReason: string | null; // survey code, set when status = WITHDRAWN
  withdrawnAt: string | null;
};

/** Survey reason codes for withdrawing an application (labels are i18n'd in the UI). */
export const WITHDRAW_REASONS = [
  "found_other",
  "rate_low",
  "location",
  "schedule",
  "changed_mind",
  "other",
] as const;
export type WithdrawReason = (typeof WITHDRAW_REASONS)[number];

export const applicationsService = {
  /** The signed-in specialist's applications, newest first. [] when unauthenticated/unreachable. */
  async getMine(locale?: string): Promise<MyApplication[]> {
    try {
      return await apiGet<MyApplication[]>("/api/me/applications", { locale });
    } catch {
      return [];
    }
  },

  /** Withdraw an open application — requires a survey reason; comment is optional. */
  async withdraw(applicationId: string, reason: WithdrawReason, comment?: string): Promise<void> {
    await apiPost(`/api/me/applications/${encodeURIComponent(applicationId)}/withdraw`, {
      reason,
      comment: comment?.trim() || null,
    });
  },
};
