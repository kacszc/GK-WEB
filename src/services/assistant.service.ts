import { apiPost } from "@/lib/api-client";
import type { ExperienceRange, SpecialistRateType } from "@/lib/types";

/**
 * Structured profile-field draft extracted by the BACKEND from a free-text self-description
 * ("Jestem barmanem od 4 lat, 45 zł/h"). All fields optional — the form pre-fills what was
 * recognized and the user always reviews. Extraction currently runs on a deterministic
 * heuristic (mock); swapping it for an LLM provider is a backend-only change.
 */
export type ProfileDraft = {
  industry: string | null;
  profession: string | null;
  experienceRange: ExperienceRange | null;
  rateFrom: number | null;
  rateType: SpecialistRateType | null;
};

export const assistantService = {
  /** Ask the backend to turn the user's description into form fields. Authenticated. */
  async draftProfile(text: string): Promise<ProfileDraft> {
    return apiPost<ProfileDraft>("/api/assistant/profile-draft", { text });
  },
};
