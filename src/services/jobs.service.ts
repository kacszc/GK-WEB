import type {
  JobDraft,
  JobResult,
  JobPosting,
  JobDuration,
  JobEngagement,
  JobRateType,
  MyJobStatus,
} from "@/lib/types";
import { apiGet, apiPost, apiPut } from "@/lib/api-client";

/** Backend job DTO (list + detail). */
type JobDto = {
  id: string;
  title: string;
  profession: string;
  district: string;
  rateFrom: number;
  rateTo?: number | null;
  rateDisclosed?: boolean;
  currency?: string;
  rateType?: JobRateType;
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
  employerId?: string;
  employerVerified?: boolean;
  employerLogoUrl?: string | null;
  // Detail-only — used to prefill the edit form (owner).
  professionCode?: string;
  customProfession?: string;
  industryCode?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  engagement?: string;
  duration?: string;
  workDate?: string | null;
  workDateTo?: string | null;
};

/** A job's editable content (owner edit form) + its lifecycle status. */
export type EditableJob = { draft: JobDraft; status: MyJobStatus };

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
    employerId: d.employerId,
    employerVerified: d.employerVerified ?? false,
    employerLogoUrl: d.employerLogoUrl ?? null,
    postedAgo: formatPosted(d.createdAt),
    description: d.description ?? "",
    promoted: d.promoted ?? false,
    lat: d.lat ?? d.latitude,
    lng: d.lng ?? d.longitude,
    rateDisclosed: d.rateDisclosed ?? true,
    currency: d.currency ?? "PLN",
    rateType: d.rateType ?? "hourly",
    rateTo: d.rateTo ?? null,
  };
}

/** Build the POST/PUT body shared by create + update from a draft. */
function toJobBody(draft: JobDraft) {
  const isOther = !draft.profession;
  return {
    title: draft.title,
    professionCode: isOther ? null : draft.profession,
    industryCode: draft.industry,
    customProfession: isOther ? draft.customProfession.trim() : null,
    description: draft.description,
    district: draft.district,
    // City/zone centre (or a precise point); fall back to Warsaw centre only if nothing was picked.
    latitude: draft.lat ?? 52.2297,
    longitude: draft.lng ?? 21.0122,
    radiusKm: draft.radiusKm,
    people: draft.people,
    rateFrom: draft.rateUndisclosed ? 0 : (draft.rate ?? 0),
    rateTo: draft.rateUndisclosed ? null : draft.rateTo,
    rateDisclosed: !draft.rateUndisclosed,
    currency: draft.currency,
    rateType: draft.rateType,
    hours: draft.hours,
    engagement: draft.engagement,
    duration: draft.duration || null,
    workDate: draft.date ? draft.date.toISOString().slice(0, 10) : null,
    workDateTo: draft.dateTo ? draft.dateTo.toISOString().slice(0, 10) : null,
    // Job-side catalog attributes (accommodation/equipment offered, …). Omitted (undefined) → the
    // backend leaves existing answers untouched (so editing without re-loading them is non-destructive).
    ...(draft.jobAttributes ? { jobAttributes: draft.jobAttributes } : {}),
  };
}

/** Adapt a backend detail DTO to an editable draft (owner edit form prefill). */
function toEditableJob(d: JobDto): EditableJob {
  return {
    status: (d.status?.toLowerCase() as MyJobStatus) ?? "active",
    draft: {
      industry: d.industryCode ?? "",
      profession: d.professionCode ?? "",
      customProfession: d.customProfession ?? "",
      title: d.title ?? "",
      description: d.description ?? "",
      duration: (d.duration as JobDuration) ?? "",
      date: d.workDate ? new Date(d.workDate) : null,
      dateTo: d.workDateTo ? new Date(d.workDateTo) : null,
      // Location is stored as district + point (no curated city code) — keep them; the employer can
      // re-pick a city to change it. cityName left blank (district carries the label in the summary).
      cityCode: "",
      cityName: "",
      district: d.district ?? "",
      lat: d.latitude ?? d.lat ?? null,
      lng: d.longitude ?? d.lng ?? null,
      radiusKm: d.radiusKm ?? 10,
      people: d.people ?? 1,
      rate: d.rateDisclosed === false ? null : (d.rateFrom ?? null),
      rateTo: d.rateTo ?? null,
      rateUndisclosed: d.rateDisclosed === false,
      currency: d.currency ?? "PLN",
      rateType: d.rateType ?? "hourly",
      engagement: (d.engagement as JobEngagement) ?? "full_time",
      hours: d.hours ?? null,
      contactMethod: "app",
      phone: "",
    },
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
  employerId?: string; // only this company's jobs (for the company profile)
  near?: { lat: number; lng: number };
  maxDistanceKm?: number;
  /** "When" range (ISO yyyy-mm-dd): only jobs whose work date(s) overlap it (undated jobs always match). */
  fromDate?: string;
  toDate?: string;
  page?: number; // 0-indexed page (server-side pagination)
  size?: number; // page size
  locale?: string;
};

/** One page of job postings + total matching count (server-side pagination). */
export type JobSearchResult = { items: JobPosting[]; total: number };

export const jobsService = {
  /**
   * Create a job posting. {@code publish} true → goes live immediately (specialists notified);
   * false → saved as a private draft. Returns the new job's id + status.
   */
  async create(draft: JobDraft, publish = true): Promise<JobResult> {
    const dto = await apiPost<JobDto>("/api/jobs", { ...toJobBody(draft), publish });
    return { id: dto.id, status: (dto.status?.toLowerCase() as MyJobStatus) ?? "active" };
  },

  /** Edit an owned job (owner only). Returns the updated status. */
  async update(id: string, draft: JobDraft): Promise<JobResult> {
    const dto = await apiPut<JobDto>(`/api/jobs/${encodeURIComponent(id)}`, toJobBody(draft));
    return { id: dto.id, status: (dto.status?.toLowerCase() as MyJobStatus) ?? "active" };
  },

  /** Publish a draft / re-show an unpublished job (owner only). */
  async publish(id: string): Promise<{ status: MyJobStatus }> {
    const dto = await apiPost<JobDto>(`/api/jobs/${encodeURIComponent(id)}/publish`, {});
    return { status: (dto.status?.toLowerCase() as MyJobStatus) ?? "active" };
  },

  /** Hide an active job from search (owner only). */
  async unpublish(id: string): Promise<{ status: MyJobStatus }> {
    const dto = await apiPost<JobDto>(`/api/jobs/${encodeURIComponent(id)}/unpublish`, {});
    return { status: (dto.status?.toLowerCase() as MyJobStatus) ?? "unpublished" };
  },

  /** Full editable content of an owned job (to prefill the edit form). */
  async getEditable(id: string, locale?: string): Promise<EditableJob> {
    return toEditableJob(await apiGet<JobDto>(`/api/jobs/${encodeURIComponent(id)}`, { locale }));
  },

  /** Browse public job postings (job-seeker side). Backend sorts (promoted first) + paginates. */
  async searchJobs(filters: JobFilters = {}): Promise<JobSearchResult> {
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
    if (filters.employerId) params.set("employerId", filters.employerId);
    if (filters.fromDate) params.set("from", filters.fromDate);
    if (filters.toDate) params.set("to", filters.toDate);
    if (filters.page != null) params.set("page", String(filters.page));
    if (filters.size != null) params.set("size", String(filters.size));
    const qs = params.toString();
    const data = await apiGet<{ items: JobDto[]; total: number }>(`/api/jobs${qs ? `?${qs}` : ""}`, {
      locale: filters.locale,
    });
    return { items: data.items.map(toJobPosting), total: data.total };
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
