import type {
  IndustryOption,
  GusCompany,
  WorkerOnboardingData,
  WorkerOnboardingResult,
  EmployerOnboardingData,
  EmployerOnboardingResult,
} from "@/lib/types";
import { apiGet } from "@/lib/api-client";
import { mockDelay } from "./mock-data";

/** Run `fn`, falling back to `fallback` if the backend is unreachable/errors. */
async function withFallback<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback();
  }
}

/** Backend industry DTO: { code, name }. */
type IndustryDto = { code: string; name: string };

// Industries (branże) — shared by both onboarding flows.
const industries: IndustryOption[] = [
  { id: "gastronomy", label: "Gastronomia" },
  { id: "events", label: "Eventy" },
  { id: "hospitality", label: "Hotelarstwo" },
  { id: "electrical", label: "Elektryka" },
  { id: "construction", label: "Budownictwo" },
  { id: "transport", label: "Transport" },
  { id: "cleaning", label: "Sprzątanie" },
  { id: "warehouse", label: "Magazyn" },
  { id: "care", label: "Opieka" },
];

// Specializations keyed by industry id.
const specializations: Record<string, string[]> = {
  gastronomy: ["Barman", "Kelner", "Kucharz", "Pomoc kuchenna", "Barista", "Mixolog", "Hostessa", "Kasa fiskalna"],
  events: ["Obsługa eventów", "Technik sceniczny", "Host/Hostessa", "Ochrona", "Montaż", "Koordynator"],
  hospitality: ["Recepcja", "Housekeeping", "Concierge", "Room service", "Spa"],
  electrical: ["Instalacje", "Pomiary", "Automatyka", "Fotowoltaika"],
  construction: ["Murarz", "Glazurnik", "Malarz", "Hydraulik", "Stolarz"],
  transport: ["Kierowca B", "Kierowca C+E", "Kurier", "Magazynier"],
  cleaning: ["Sprzątanie biur", "Mycie okien", "Sprzątanie po remoncie"],
  warehouse: ["Kompletacja", "Wózek widłowy", "Pakowanie", "Inwentaryzacja"],
  care: ["Opieka nad osobami starszymi", "Opieka nad dziećmi", "Pomoc domowa"],
};

const languages = ["Polski", "Angielski", "Ukraiński", "Niemiecki", "Rosyjski"];

const teamSizes = ["1–2 osoby", "3–5 osób", "5–10 osób", "10–25 osób", "25+ osób"];

export const onboardingService = {
  /** Industries used for the branża pickers. Backend: [{code,name}]. */
  async getIndustries(): Promise<IndustryOption[]> {
    return withFallback(
      async () => {
        const dtos = await apiGet<IndustryDto[]>("/api/catalog/industries");
        return dtos.map((d) => ({ id: d.code, label: d.name }));
      },
      async () => {
        await mockDelay();
        return industries;
      },
    );
  },

  /** Specializations available within an industry. Backend: string[]. */
  async getSpecializations(industryId: string): Promise<string[]> {
    return withFallback(
      () =>
        apiGet<string[]>(
          `/api/catalog/industries/${encodeURIComponent(industryId)}/specializations`,
        ),
      async () => {
        await mockDelay();
        return specializations[industryId] ?? specializations.gastronomy;
      },
    );
  },

  /** Spoken languages list. Backend: string[]. */
  async getLanguages(): Promise<string[]> {
    return withFallback(
      () => apiGet<string[]>("/api/catalog/languages"),
      async () => {
        await mockDelay(120, 300);
        return languages;
      },
    );
  },

  /** Average-team-size options for employer onboarding. */
  async getTeamSizes(): Promise<string[]> {
    // TODO(backend): return apiGet("/catalog/team-sizes");
    await mockDelay(120, 300);
    return teamSizes;
  },

  /** Verify the SMS/email one-time code. Mock accepts any 6-digit code. */
  async verifyCode(code: string): Promise<boolean> {
    // TODO(backend): return apiPost("/auth/verify-code", { code });
    await mockDelay(500, 900);
    return /^\d{6}$/.test(code);
  },

  /** Look up a company in the GUS registry by NIP. */
  async lookupGus(nip: string): Promise<GusCompany> {
    // TODO(backend): return apiGet(`/gus/company?nip=${nip}`);
    await mockDelay(800, 1400);
    const clean = nip.replace(/\s+/g, "");
    return {
      name: "Marriott Warszawa Sp. z o.o.",
      nip: clean || "5252335525",
      regon: "012345678",
      address: "Aleja Jana Pawła II 22, Warszawa",
      status: "Aktywna · od 1989",
    };
  },

  /** Persist specialist onboarding and return the starting Trust Score. */
  async completeWorker(data: WorkerOnboardingData): Promise<WorkerOnboardingResult> {
    // TODO(backend): return apiPost("/onboarding/specialist", data);
    await mockDelay(700, 1200);
    const firstName = data.name.trim().split(/\s+/)[0] || "Specjalisto";
    return { trustScore: 42, firstName };
  },

  /** Persist employer onboarding and return the welcome-token bonus. */
  async completeEmployer(data: EmployerOnboardingData): Promise<EmployerOnboardingResult> {
    // TODO(backend): return apiPost("/onboarding/employer", data);
    await mockDelay(700, 1200);
    return { bonusTokens: 10, companyName: data.company.name };
  },
};
