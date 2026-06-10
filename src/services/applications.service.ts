import { apiGet } from "@/lib/api-client";

/** A specialist's own job application (their history). */
export type MyApplication = {
  id: string;
  jobId: string;
  title: string;
  profession: string; // localized label
  district: string;
  rateFrom: number;
  rateDisclosed: boolean;
  currency: string;
  jobStatus: string; // ACTIVE / FILLED / COMPLETED / EXPIRED
  status: string; // APPLIED / SELECTED / REJECTED
  appliedAt: string;
};

export const applicationsService = {
  /** The signed-in specialist's applications, newest first. [] when unauthenticated/unreachable. */
  async getMine(locale?: string): Promise<MyApplication[]> {
    try {
      return await apiGet<MyApplication[]>("/api/me/applications", { locale });
    } catch {
      return [];
    }
  },
};
