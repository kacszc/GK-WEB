import type { JobDraft, JobResult, JobPosting, Availability } from "@/lib/types";
// import { apiGet } from "@/lib/api-client";
import { specialists } from "./mock-specialists";
import { jobPostings } from "./mock-jobs";
import { mockDelay } from "./mock-data";

export type JobFilters = {
  q?: string;
  profession?: string;
  district?: string;
  when?: Availability[];
  rateMin?: number;
  locale?: string;
};

export const jobsService = {
  /** Publish a job posting and return how many specialists were notified. */
  async create(draft: JobDraft): Promise<JobResult> {
    // TODO(backend): return apiPost("/jobs", draft, { locale });
    await mockDelay(700, 1300);

    const q = draft.profession.trim().toLowerCase();
    const matching = specialists.filter(
      (s) =>
        s.availability !== "date" &&
        (s.role.toLowerCase().includes(q) ||
          s.specialties.some((sp) => sp.label.toLowerCase().includes(q))),
    ).length;

    // Scale the mock count so it feels like a real marketplace.
    const notifiedCount = Math.max(8, matching * 11 + (draft.people - 1) * 3);

    return { id: `job-${Date.now().toString(36)}`, notifiedCount };
  },

  /** Browse public job postings (job-seeker side). */
  async searchJobs(filters: JobFilters = {}): Promise<JobPosting[]> {
    // TODO(backend): return apiGet(`/jobs?${qs}`, { locale: filters.locale });
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

  /** Apply to a job posting (mock). */
  async apply(jobId: string, message: string): Promise<{ ok: true }> {
    // TODO(backend): return apiPost(`/jobs/${jobId}/applications`, { message });
    void jobId;
    void message;
    await mockDelay(600, 1100);
    return { ok: true };
  },
};
