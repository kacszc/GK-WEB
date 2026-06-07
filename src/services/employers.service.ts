import type { EmployerProfile, EmployerRating, EmployerReview } from "@/lib/types";
import { apiGet } from "@/lib/api-client";

/** Backend employer profile DTO (subset of the frontend EmployerProfile). */
type EmployerDto = {
  id: string;
  name: string;
  initial: string;
  verified: boolean;
  industries: string[];
  city: string;
  rating: number | null;
  completedJobs: number;
  memberSince: string;
  description: string;
  avgHireDays: number | null;
  onTimePayment: number;
  hiredRoles: { role: string; count: number }[];
  ratings: EmployerRating[];
  flags: number;
  reviews: EmployerReview[];
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
    industries: d.industries,
    location: d.city,
    website: "",
    email: "",
    rating: d.rating ?? 0,
    completedJobs: d.completedJobs,
    memberSince: d.memberSince,
    description: d.description,
    avgHireDays: d.avgHireDays ?? 0,
    onTimePayment: d.onTimePayment,
    hiredRoles: d.hiredRoles,
    ratings: d.ratings,
    flags: d.flags,
    reviews: d.reviews,
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
