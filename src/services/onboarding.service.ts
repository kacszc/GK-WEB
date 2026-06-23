import type {
  IndustryOption,
  GusCompany,
  WorkerOnboardingData,
  WorkerOnboardingResult,
  EmployerOnboardingData,
  EmployerOnboardingResult,
  AttributeGroupDef,
} from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api-client";

/** Backend industry DTO: { code, name }. */
type IndustryDto = { code: string; name: string };

/** A pickable specialization: stable code (submitted) + localized label (shown). */
export type SpecializationOption = { code: string; label: string };

/** A pickable language: stable code (submitted, e.g. "pl") + localized name (shown). */
export type LanguageOption = { code: string; name: string };

// Average-team-size options for employer onboarding. No backend catalog — fixed buckets.
const teamSizes = ["1–2 osoby", "3–5 osób", "5–10 osób", "10–25 osób", "25+ osób"];

export const onboardingService = {
  /** Industries used for the branża pickers. Backend: [{code,name}]. */
  async getIndustries(): Promise<IndustryOption[]> {
    const dtos = await apiGet<IndustryDto[]>("/api/catalog/industries");
    return dtos.map((d) => ({ id: d.code, label: d.name }));
  },

  /**
   * Specializations within an industry as {code,label} options: the picker submits codes (stored as
   * the specialist's specialization relation, driving code-based search) and shows localized labels.
   */
  async getSpecializations(industryId: string): Promise<SpecializationOption[]> {
    return apiGet<SpecializationOption[]>(
      `/api/catalog/industries/${encodeURIComponent(industryId)}/specializations`,
    );
  },

  /** Spoken languages as {code,name} options: the picker submits codes (stored on the profile,
   * driving the language filter) and shows localized names. */
  async getLanguages(): Promise<LanguageOption[]> {
    return apiGet<LanguageOption[]>("/api/catalog/languages");
  },

  /** Average-team-size options for employer onboarding. */
  async getTeamSizes(): Promise<string[]> {
    return teamSizes;
  },

  /**
   * Catalog-driven attribute schema for the dynamic onboarding step: groups → attributes → options,
   * already localized by the backend. Scoped to the chosen industry + specializations.
   */
  async getAttributes(industry: string, specializations: string[]): Promise<AttributeGroupDef[]> {
    const params = new URLSearchParams();
    if (industry) params.set("industry", industry);
    for (const code of specializations) params.append("specialization", code);
    const qs = params.toString();
    return apiGet<AttributeGroupDef[]>(`/api/catalog/attributes${qs ? `?${qs}` : ""}`);
  },

  /** Look up a company in the GUS registry by NIP. */
  async lookupGus(nip: string): Promise<GusCompany> {
    const clean = nip.replace(/\s+/g, "");
    return apiGet<GusCompany>(`/api/gus/company?nip=${encodeURIComponent(clean)}`);
  },

  /** Persist specialist onboarding (creates the profile) and return the starting Trust Score. */
  async completeWorker(data: WorkerOnboardingData): Promise<WorkerOnboardingResult> {
    const firstName = data.name.trim().split(/\s+/)[0] || "Specjalisto";
    const res = await apiPost<{ id: string; trustScore: number }>("/api/me/specialist-profile", {
      displayName: data.name,
      headline: data.specializations.join(", ") || data.industry, // free-text label list
      district: data.baseLocation,
      lat: data.lat, // geo origin for distance-based search (omitted → backend default)
      lng: data.lng,
      specializationCodes: data.specializationCodes, // structured codes → search relation
      customSpecializations: data.customSpecializations, // "Inne" → industry + free-text role
      languageCodes: data.languages, // language codes → language filter (back-compat)
      // Languages with proficiency level (code → level); falls back to plain codes server-side.
      languages: data.languages.map((code) => ({ code, level: data.languageLevels?.[code] ?? null })),
      attributes: data.attributes ?? [], // dynamic attribute answers
    });
    return { trustScore: res.trustScore, firstName };
  },

  /** Persist employer onboarding (creates the company profile) and return the welcome-token bonus. */
  async completeEmployer(data: EmployerOnboardingData): Promise<EmployerOnboardingResult> {
    await apiPost("/api/me/employer-profile", {
      name: data.company.name,
      nip: data.company.nip,
      regon: data.company.regon,
      address: data.company.address,
      city: data.location,
      industries: data.industries,
      monthlyHires: data.teamSize || null,
    });
    return { bonusTokens: 10, companyName: data.company.name };
  },
};
