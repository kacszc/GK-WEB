import type { JobDraft, JobResult } from "@/lib/types";
// import { apiGet } from "@/lib/api-client";
import { specialists } from "./mock-specialists";
import { mockDelay } from "./mock-data";

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
};
