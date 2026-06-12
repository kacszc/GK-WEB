import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";

// --- Catalog dictionary shapes (raw editable fields; labels are i18n'd by code on read) -------
export type AdminIndustry = { code: string; name: string; position: number };
export type AdminSpecialization = {
  id?: string;
  code: string;
  industryCode: string;
  name: string;
  popular: boolean;
  availableNow: number;
};
export type AdminLanguage = { code: string; name: string; position: number };

const base = "/api/admin/catalog";

export const adminService = {
  /** True when the signed-in user is an operator (admin). The CMS UI gates on this. */
  async amIAdmin(): Promise<boolean> {
    try {
      await apiGet("/api/admin/me");
      return true;
    } catch {
      return false;
    }
  },

  industries: {
    list: () => apiGet<AdminIndustry[]>(`${base}/industries`),
    create: (d: AdminIndustry) => apiPost<AdminIndustry>(`${base}/industries`, d),
    update: (code: string, d: AdminIndustry) =>
      apiPut<AdminIndustry>(`${base}/industries/${encodeURIComponent(code)}`, d),
    remove: (code: string) => apiDelete<void>(`${base}/industries/${encodeURIComponent(code)}`),
  },

  specializations: {
    list: () => apiGet<AdminSpecialization[]>(`${base}/specializations`),
    create: (d: AdminSpecialization) => apiPost<AdminSpecialization>(`${base}/specializations`, d),
    update: (code: string, d: AdminSpecialization) =>
      apiPut<AdminSpecialization>(`${base}/specializations/${encodeURIComponent(code)}`, d),
    remove: (code: string) => apiDelete<void>(`${base}/specializations/${encodeURIComponent(code)}`),
  },

  languages: {
    list: () => apiGet<AdminLanguage[]>(`${base}/languages`),
    create: (d: AdminLanguage) => apiPost<AdminLanguage>(`${base}/languages`, d),
    update: (code: string, d: AdminLanguage) =>
      apiPut<AdminLanguage>(`${base}/languages/${encodeURIComponent(code)}`, d),
    remove: (code: string) => apiDelete<void>(`${base}/languages/${encodeURIComponent(code)}`),
  },
};
