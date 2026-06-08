import type { JobDraft, JobResult, JobPosting, JobDuration, JobEngagement } from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api-client";

/** Backend job DTO (list + detail). */
type JobDto = {
  id: string;
  title: string;
  profession: string;
  district: string;
  rateFrom: number;
  people: number;
  status: string;
  createdAt: string;
  distanceKm: number;
  lat?: number;
  lng?: number;
  promoted?: boolean;
  // Detail-only (optional) fields.
  description?: string;
  hours?: number;
  employer?: string;
  employerVerified?: boolean;
};

/** Backend sends an ISO timestamp → render a relative label. */
function formatPosted(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const hours = Math.floor((Date.now() - date.getTime()) / 3_600_000);
  if (hours < 1) return "przed chwilą";
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} dni temu`;
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

/** Adapt a backend job DTO to the frontend JobPosting. */
function toJobPosting(d: JobDto): JobPosting {
  return {
    id: d.id,
    title: d.title,
    profession: d.profession,
    district: d.district,
    distanceKm: d.distanceKm,
    rate: d.rateFrom,
    hours: d.hours ?? 0,
    when: "now",
    employer: d.employer ?? "",
    employerVerified: d.employerVerified ?? false,
    postedAgo: formatPosted(d.createdAt),
    description: d.description ?? "",
    promoted: d.promoted ?? false,
    lat: d.lat,
    lng: d.lng,
  };
}

export type JobFilters = {
  q?: string;
  professions?: string[]; // specialization codes (any-of)
  industries?: string[]; // whole-industry codes (any-of)
  customIndustries?: string[]; // "Inne" jobs in these industries
  durations?: JobDuration[];
  engagements?: JobEngagement[];
  district?: string;
  rateMin?: number;
  near?: { lat: number; lng: number };
  maxDistanceKm?: number;
  locale?: string;
};

export const jobsService = {
  /** Publish a job posting and return its id + a cosmetic "notified N specialists" estimate. */
  async create(draft: JobDraft): Promise<JobResult> {
    // TODO(geocoder): district → lat/lng. For now default to Warsaw centre (matches profile defaults).
    // One role per job: either a catalog specialization code, or "Inne" with a custom label.
    const isOther = !draft.profession;
    const dto = await apiPost<JobDto>("/api/jobs", {
      title: draft.title,
      professionCode: isOther ? null : draft.profession,
      industryCode: draft.industry,
      customProfession: isOther ? draft.customProfession.trim() : null,
      description: draft.description,
      district: draft.district,
      // Picked on the map when available; otherwise default to Warsaw centre (no geocoder yet).
      latitude: draft.lat ?? 52.2297,
      longitude: draft.lng ?? 21.0122,
      radiusKm: draft.radiusKm,
      people: draft.people,
      rateFrom: draft.rate ?? 0,
      rateTo: draft.rateTo,
      hours: draft.hours,
      engagement: draft.engagement,
      duration: draft.duration || null,
      workDate: draft.date ? draft.date.toISOString().slice(0, 10) : null,
      workDateTo: draft.dateTo ? draft.dateTo.toISOString().slice(0, 10) : null,
    });
    // Cosmetic estimate (the backend doesn't compute reach yet).
    const notifiedCount = Math.max(8, draft.people * 11);
    return { id: dto.id, notifiedCount };
  },

  /** Browse public job postings (job-seeker side) — mirrors the specialist search filters. */
  async searchJobs(filters: JobFilters = {}): Promise<JobPosting[]> {
    const params = new URLSearchParams();
    if (filters.near) {
      params.set("lat", String(filters.near.lat));
      params.set("lng", String(filters.near.lng));
    }
    if (filters.maxDistanceKm != null) params.set("radiusKm", String(filters.maxDistanceKm));
    if (filters.professions?.length) params.set("professions", filters.professions.join(","));
    if (filters.industries?.length) params.set("industries", filters.industries.join(","));
    if (filters.customIndustries?.length) params.set("customIndustries", filters.customIndustries.join(","));
    if (filters.durations?.length) params.set("durations", filters.durations.join(","));
    if (filters.engagements?.length) params.set("engagements", filters.engagements.join(","));
    if (filters.district) params.set("district", filters.district);
    if (filters.q) params.set("q", filters.q);
    if (filters.rateMin != null) params.set("rateMin", String(filters.rateMin));
    const qs = params.toString();
    const dtos = await apiGet<JobDto[]>(`/api/jobs${qs ? `?${qs}` : ""}`, { locale: filters.locale });
    return dtos.map(toJobPosting);
  },

  /** Full detail for a single job posting. */
  async getById(id: string, locale?: string): Promise<JobPosting> {
    return toJobPosting(await apiGet<JobDto>(`/api/jobs/${encodeURIComponent(id)}`, { locale }));
  },

  /** Apply to a job posting (SPECIALIST). Returns the created application id. */
  async apply(jobId: string, message: string): Promise<{ applicationId?: string }> {
    return apiPost<{ applicationId: string }>(`/api/jobs/${encodeURIComponent(jobId)}/apply`, { message });
  },
};
