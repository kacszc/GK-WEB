import type { MyJob, SavedContact, ActivityItem, ActivityType, Applicant } from "@/lib/types";
import { apiGet, apiPost, ApiError } from "@/lib/api-client";

/** Resolve an owner-profile GET, treating "not created yet" (404) as null rather than an error. */
async function optionalProfile<T>(path: string, locale?: string): Promise<T | null> {
  try {
    return await apiGet<T>(path, { locale });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/** Backend applicant DTO (job owner view) — bare; enriched client-side from the specialist profile. */
type ApplicantDto = {
  applicationId: string;
  specialistId: string;
  message: string;
  status: "APPLIED" | "SELECTED" | "REJECTED";
  appliedAt: string;
};

/** Public specialist profile (subset) used to enrich applicants. */
type SpecialistProfileDto = {
  id: string;
  name: string;
  headline: string;
  district: string;
  trustScore: number;
  rating: number | null;
  reviews: number;
  rateFrom: number;
};

/** Relative "applied ago" label from an ISO timestamp. */
function appliedAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hours = Math.floor((Date.now() - date.getTime()) / 3_600_000);
  if (hours < 1) return "przed chwilą";
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  return `${days} dni temu`;
}

/** Employer's own job from GET /api/me/jobs. */
type MyJobDto = {
  id: string;
  title: string;
  profession: string;
  district: string;
  status: "active" | "filled" | "completed" | "expired";
  applicants: number;
  rate: number;
  rateDisclosed?: boolean;
  currency?: string;
  createdAt: string;
};

/** A specialist the employer has paid to contact. */
type ContactCardDto = {
  id: string;
  name: string;
  role: string | null;
  district: string | null;
  trustScore: number;
  rating: number | null;
};

/** The signed-in specialist's own profile (read-only "Your details" view). */
export type MySpecialistProfile = {
  displayName: string;
  headline: string | null;
  district: string | null;
  rateFrom: number;
  specializations: string[];
  languages: string[];
  availability: string | null;
  kycVerified: boolean;
};

/** The signed-in employer's own company profile, including registry fields (NIP/REGON/address). */
export type MyEmployerProfile = {
  name: string;
  nip: string | null;
  regon: string | null;
  address: string | null;
  city: string | null;
  verified: boolean;
  industries: string[];
  monthlyHires: string | null;
};

/** Notification row (also used as the activity feed source). */
type NotificationDto = { id: string; type: string; title: string; createdAt: string };

/** Map a backend notification type to the activity-feed category. */
function activityType(type: string): ActivityType {
  switch (type) {
    case "JOB_COMPLETED":
      return "hired";
    case "REVIEW_RECEIVED":
      return "review";
    case "JOB_APPLICATION":
      return "applied";
    case "MESSAGE":
      return "contacted";
    default:
      return "job_posted";
  }
}

function toMyJob(d: MyJobDto): MyJob {
  return {
    id: d.id,
    title: d.title,
    profession: d.profession,
    district: d.district,
    status: d.status,
    applicants: d.applicants,
    rate: d.rate,
    rateDisclosed: d.rateDisclosed ?? true,
    currency: d.currency ?? "PLN",
    postedAgo: appliedAgo(d.createdAt),
  };
}

/**
 * Adapt a sparse backend applicant DTO to the UI's Applicant. The owner view
 * only knows the specialist id + message; richer profile fields are filled with
 * neutral placeholders (the detail screen links out to the full profile).
 */
function toApplicant(d: ApplicantDto, p?: SpecialistProfileDto): Applicant {
  return {
    applicationId: d.applicationId,
    status: d.status,
    id: d.specialistId,
    name: p?.name ?? "Specjalista",
    avatarIndex: 0,
    role: p?.headline ?? "",
    trustScore: p?.trustScore ?? 0,
    rating: p?.rating ?? 0,
    reviews: p?.reviews ?? 0,
    rate: p?.rateFrom ?? 0,
    district: p?.district ?? "",
    distanceKm: 0,
    appliedAgo: appliedAgo(d.appliedAt),
    message: d.message,
  };
}

export const accountService = {
  async getMyJobs(): Promise<MyJob[]> {
    const dtos = await apiGet<MyJobDto[]>("/api/me/jobs");
    return dtos.map(toMyJob);
  },
  async getContacts(): Promise<SavedContact[]> {
    const dtos = await apiGet<ContactCardDto[]>("/api/contacts");
    return dtos.map((c, i) => ({
      id: c.id,
      name: c.name,
      avatarIndex: i % 14,
      role: c.role ?? "",
      district: c.district ?? "",
      rating: c.rating ?? 0,
      trustScore: c.trustScore ?? 0,
    }));
  },
  async getActivity(): Promise<ActivityItem[]> {
    // The activity feed is the user's recent notifications.
    const dtos = await apiGet<NotificationDto[]>("/api/notifications");
    return dtos.slice(0, 20).map((n) => ({
      id: n.id,
      type: activityType(n.type),
      text: n.title,
      time: appliedAgo(n.createdAt),
    }));
  },
  /** A single owned job — derived from the real /api/me/jobs list. */
  async getJob(id: string): Promise<MyJob | null> {
    const jobs = await this.getMyJobs();
    return jobs.find((j) => j.id === id) ?? null;
  },
  async getApplicants(jobId: string): Promise<Applicant[]> {
    const dtos = await apiGet<ApplicantDto[]>(`/api/jobs/${encodeURIComponent(jobId)}/applicants`);
    // Enrich each applicant with the specialist's public profile (name/trust/rating).
    const ids = [...new Set(dtos.map((d) => d.specialistId))];
    const profiles = new Map<string, SpecialistProfileDto>();
    await Promise.all(
      ids.map(async (id) => {
        try {
          profiles.set(id, await apiGet<SpecialistProfileDto>(`/api/specialists/${encodeURIComponent(id)}`));
        } catch {
          /* applicant without a public profile — leave placeholders */
        }
      }),
    );
    return dtos.map((d) => toApplicant(d, profiles.get(d.specialistId)));
  },
  /** Select an applicant (job owner). */
  async selectApplicant(jobId: string, applicationId: string): Promise<{ ok: true }> {
    await apiPost(`/api/jobs/${encodeURIComponent(jobId)}/select`, { applicationId });
    return { ok: true };
  },
  async confirmCompletion(jobId: string): Promise<{ ok: true }> {
    await apiPost(`/api/jobs/${encodeURIComponent(jobId)}/complete`);
    return { ok: true };
  },
  /** The current specialist's own profile (localized specialization labels); null if not created yet. */
  async getMySpecialistProfile(locale?: string): Promise<MySpecialistProfile | null> {
    return optionalProfile<MySpecialistProfile>("/api/me/specialist-profile", locale);
  },
  /** The current employer's own company profile (incl. NIP/REGON/address); null if not created yet. */
  async getMyEmployerProfile(locale?: string): Promise<MyEmployerProfile | null> {
    return optionalProfile<MyEmployerProfile>("/api/me/employer-profile", locale);
  },
  /** Boost the current specialist's own profile (sorts first in search). Payment not wired yet — grants it. */
  async boostMyProfile(days: number): Promise<{ promotedUntil: string }> {
    return apiPost<{ promotedUntil: string }>("/api/me/specialist-profile/boost", { days });
  },
};
