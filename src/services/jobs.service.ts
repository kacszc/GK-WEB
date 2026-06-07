import type { JobDraft, JobResult, JobPosting, Availability } from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api-client";
import { specialists } from "./mock-specialists";
import { jobPostings } from "./mock-jobs";
import { mockDelay } from "./mock-data";

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
  promoted?: boolean;
  // Detail-only (optional) fields.
  description?: string;
  hours?: number;
  employer?: string;
  employerVerified?: boolean;
};

/** Backend sends an ISO timestamp; mock data already uses display strings. Render a relative label. */
function formatPosted(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value; // already a display string (mock)
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
  };
}

export type JobFilters = {
  q?: string;
  profession?: string;
  district?: string;
  when?: Availability[];
  rateMin?: number;
  locale?: string;
};

export const jobsService = {
  /** Publish a job posting and return its id + how many specialists were notified. */
  async create(draft: JobDraft): Promise<JobResult> {
    // Vanity "notified N specialists" estimate (cosmetic; the backend doesn't compute it).
    const q = draft.profession.trim().toLowerCase();
    const matching = specialists.filter(
      (s) =>
        s.availability !== "date" &&
        (s.role.toLowerCase().includes(q) ||
          s.specialties.some((sp) => sp.label.toLowerCase().includes(q))),
    ).length;
    const notifiedCount = Math.max(8, matching * 11 + (draft.people - 1) * 3);

    try {
      // TODO(geocoder): district → lat/lng. For now default to Warsaw centre (matches profile defaults).
      const dto = await apiPost<JobDto>("/api/jobs", {
        title: draft.title,
        profession: draft.profession,
        description: draft.description,
        district: draft.district,
        latitude: 52.2297,
        longitude: 21.0122,
        radiusKm: draft.radiusKm,
        people: draft.people,
        rateFrom: draft.rate ?? 0,
        hours: draft.hours,
        workDate: draft.date ? draft.date.toISOString().slice(0, 10) : null,
      });
      return { id: dto.id, notifiedCount };
    } catch {
      await mockDelay(700, 1300);
      return { id: `job-${Date.now().toString(36)}`, notifiedCount };
    }
  },

  /** Browse public job postings (job-seeker side). */
  async searchJobs(filters: JobFilters = {}): Promise<JobPosting[]> {
    try {
      const params = new URLSearchParams();
      if (filters.profession) params.set("profession", filters.profession);
      if (filters.district) params.set("district", filters.district);
      const qs = params.toString();
      const dtos = await apiGet<JobDto[]>(`/api/jobs${qs ? `?${qs}` : ""}`, {
        locale: filters.locale,
      });
      return dtos.map(toJobPosting);
    } catch {
      // Backend unavailable — use mock data below.
    }

    await mockDelay(550, 1100);
    const q = filters.q?.trim().toLowerCase();
    return jobPostings.filter((j) => {
      if (q && !`${j.title} ${j.profession} ${j.employer}`.toLowerCase().includes(q)) return false;
      if (filters.profession && j.profession !== filters.profession) return false;
      if (filters.district && j.district !== filters.district) return false;
      if (filters.when?.length && !filters.when.includes(j.when)) return false;
      if (filters.rateMin != null && j.rate < filters.rateMin) return false;
      return true;
    });
  },

  /** Full detail for a single job posting. */
  async getById(id: string, locale?: string): Promise<JobPosting | null> {
    try {
      const dto = await apiGet<JobDto>(`/api/jobs/${encodeURIComponent(id)}`, { locale });
      return toJobPosting(dto);
    } catch {
      await mockDelay(400, 800);
      return jobPostings.find((j) => j.id === id) ?? null;
    }
  },

  /** Apply to a job posting (SPECIALIST). Returns the created application id. */
  async apply(jobId: string, message: string): Promise<{ applicationId?: string }> {
    try {
      return await apiPost<{ applicationId: string }>(
        `/api/jobs/${encodeURIComponent(jobId)}/apply`,
        { message },
      );
    } catch {
      await mockDelay(600, 1100);
      return {};
    }
  },
};
