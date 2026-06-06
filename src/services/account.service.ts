import type { MyJob, SavedContact, ActivityItem, Applicant } from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api-client";
import { myJobs, savedContacts, activity, applicants } from "./mock-account";
import { mockDelay } from "./mock-data";

/** Backend applicant DTO (job owner view). */
type ApplicantDto = {
  applicationId: string;
  specialistId: string;
  message: string;
  status: "APPLIED" | "SELECTED" | "REJECTED";
  appliedAt: string;
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

/**
 * Adapt a sparse backend applicant DTO to the UI's Applicant. The owner view
 * only knows the specialist id + message; richer profile fields are filled with
 * neutral placeholders (the detail screen links out to the full profile).
 */
function toApplicant(d: ApplicantDto): Applicant {
  return {
    applicationId: d.applicationId,
    status: d.status,
    id: d.specialistId,
    name: d.specialistId,
    avatarIndex: 0,
    role: "",
    trustScore: 0,
    rating: 0,
    reviews: 0,
    rate: 0,
    district: "",
    distanceKm: 0,
    appliedAgo: appliedAgo(d.appliedAt),
    message: d.message,
  };
}

export const accountService = {
  async getMyJobs(): Promise<MyJob[]> {
    // TODO(backend): return apiGet("/me/jobs");
    await mockDelay(400, 900);
    return myJobs;
  },
  async getContacts(): Promise<SavedContact[]> {
    // TODO(backend): return apiGet("/me/contacts");
    await mockDelay(400, 900);
    return savedContacts;
  },
  async getActivity(): Promise<ActivityItem[]> {
    // TODO(backend): return apiGet("/me/activity");
    await mockDelay(400, 900);
    return activity;
  },
  async getJob(id: string): Promise<MyJob | null> {
    await mockDelay(300, 600);
    return myJobs.find((j) => j.id === id) ?? null;
  },
  async getApplicants(jobId: string): Promise<Applicant[]> {
    try {
      const dtos = await apiGet<ApplicantDto[]>(
        `/api/jobs/${encodeURIComponent(jobId)}/applicants`,
      );
      return dtos.map(toApplicant);
    } catch {
      await mockDelay(400, 800);
      return applicants;
    }
  },
  /** Select an applicant (job owner). */
  async selectApplicant(jobId: string, applicationId: string): Promise<{ ok: true }> {
    try {
      await apiPost(`/api/jobs/${encodeURIComponent(jobId)}/select`, { applicationId });
    } catch {
      await mockDelay(400, 800);
    }
    return { ok: true };
  },
  async confirmCompletion(jobId: string): Promise<{ ok: true }> {
    try {
      await apiPost(`/api/jobs/${encodeURIComponent(jobId)}/complete`);
    } catch {
      await mockDelay(500, 900);
    }
    return { ok: true };
  },
};
