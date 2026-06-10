import { apiGet, apiPost, apiDelete } from "@/lib/api-client";

/** A specialist's certificate / qualification. */
export type Certification = {
  id: string;
  name: string;
  issuer: string | null;
  year: number | null;
  verified: boolean;
  createdAt: string;
};

export type CertificationDraft = {
  name: string;
  issuer: string | null;
  year: number | null;
};

export const certificationsService = {
  /** The signed-in specialist's certificates. [] when unauthenticated/unreachable. */
  async getMine(): Promise<Certification[]> {
    try {
      return await apiGet<Certification[]>("/api/me/certifications");
    } catch {
      return [];
    }
  },

  async create(draft: CertificationDraft): Promise<Certification> {
    return apiPost<Certification>("/api/me/certifications", draft);
  },

  async remove(id: string): Promise<void> {
    await apiDelete(`/api/me/certifications/${encodeURIComponent(id)}`);
  },
};
