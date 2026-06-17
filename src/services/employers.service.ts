import type { EmployerProfile, EmployerRating, EmployerReview } from "@/lib/types";
import { apiGet } from "@/lib/api-client";

/** Backend employer profile DTO (subset of the frontend EmployerProfile). */
type EmployerDto = {
  id: string;
  name: string;
  initial: string;
  verified: boolean;
  logoUrl: string | null;
  coverUrl: string | null;
  website: string | null;
  industries: string[] | null;
  city: string | null;
  rating: number | null;
  completedJobs: number | null;
  memberSince: string | null;
  description: string | null;
  avgHireDays: number | null;
  onTimePayment: number | null;
  hiredRoles: { role: string; count: number }[] | null;
  ratings: EmployerRating[] | null;
  flags: number | null;
  reviews: EmployerReview[] | null;
  seekingCount: number;
  seekingRoles: string;
};

/** Adapt the backend DTO to the richer frontend EmployerProfile. */
function toEmployerProfile(d: EmployerDto): EmployerProfile {
  return {
    id: d.id,
    name: d.name,
    initial: d.initial,
    verified: d.verified,
    logoUrl: d.logoUrl ?? null,
    coverUrl: d.coverUrl ?? null,
    // Array fields are nullable in the API (unset jsonb → null); default to [] so the profile
    // never crashes on .map/.length/.join for a sparse company (e.g. a freshly-created employer).
    industries: d.industries ?? [],
    location: d.city ?? "",
    website: d.website ?? "",
    email: "",
    rating: d.rating ?? 0,
    completedJobs: d.completedJobs ?? 0,
    memberSince: d.memberSince ?? "",
    description: d.description ?? "",
    avgHireDays: d.avgHireDays ?? 0,
    onTimePayment: d.onTimePayment ?? 0,
    hiredRoles: d.hiredRoles ?? [],
    ratings: d.ratings ?? [],
    flags: d.flags ?? 0,
    reviews: d.reviews ?? [],
    activeJobs: [],
    eventColors: ["#5b4636", "#c47b35", "#4f6b58", "#7a5a6b"],
    seekingCount: d.seekingCount,
    seekingRoles: d.seekingRoles,
  };
}

export const employersService = {
  async getProfile(id: string): Promise<EmployerProfile> {
    return toEmployerProfile(await apiGet<EmployerDto>(`/api/employers/${encodeURIComponent(id)}`));
  },
};
