import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

/** A job alert: get notified when a new job matches these criteria. */
export type JobAlert = {
  id: string;
  professions: string[]; // specialization codes
  industries: string[]; // whole-industry codes
  minRate: number | null;
  active: boolean;
  createdAt: string;
};

export type AlertDraft = {
  professions: string[];
  industries: string[];
  minRate: number | null;
};

export const alertsService = {
  /** The signed-in specialist's job alerts. */
  async getAlerts(): Promise<JobAlert[]> {
    return apiGet<JobAlert[]>("/api/me/job-alerts");
  },

  async create(draft: AlertDraft): Promise<JobAlert> {
    return apiPost<JobAlert>("/api/me/job-alerts", draft);
  },

  async toggle(id: string, active: boolean): Promise<JobAlert> {
    return apiPatch<JobAlert>(`/api/me/job-alerts/${encodeURIComponent(id)}`, { active });
  },

  async remove(id: string): Promise<void> {
    await apiDelete(`/api/me/job-alerts/${encodeURIComponent(id)}`);
  },
};
