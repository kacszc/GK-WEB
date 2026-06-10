import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

/** An employer's specialist alert: get notified when a new specialist matches these criteria. */
export type SpecialistAlert = {
  id: string;
  professions: string[]; // specialization codes
  industries: string[]; // whole-industry codes
  lat: number;
  lng: number;
  radiusKm: number;
  maxRate: number | null;
  active: boolean;
  createdAt: string;
};

export type SpecialistAlertDraft = {
  professions: string[];
  industries: string[];
  lat: number;
  lng: number;
  radiusKm: number;
  maxRate: number | null;
};

export const specialistAlertsService = {
  /** The signed-in employer's specialist alerts. Returns [] when unauthenticated/unreachable (no crash). */
  async getAlerts(): Promise<SpecialistAlert[]> {
    try {
      return await apiGet<SpecialistAlert[]>("/api/me/specialist-alerts");
    } catch {
      return [];
    }
  },

  async create(draft: SpecialistAlertDraft): Promise<SpecialistAlert> {
    return apiPost<SpecialistAlert>("/api/me/specialist-alerts", draft);
  },

  async toggle(id: string, active: boolean): Promise<SpecialistAlert> {
    return apiPatch<SpecialistAlert>(`/api/me/specialist-alerts/${encodeURIComponent(id)}`, { active });
  },

  async remove(id: string): Promise<void> {
    await apiDelete(`/api/me/specialist-alerts/${encodeURIComponent(id)}`);
  },
};
