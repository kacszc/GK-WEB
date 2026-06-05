import type { MyJob, Conversation, SavedContact, ActivityItem, ChatMessage, Applicant } from "@/lib/types";
// import { apiGet } from "@/lib/api-client";
import { myJobs, conversations, savedContacts, activity, threads, applicants } from "./mock-account";
import { mockDelay } from "./mock-data";

export const accountService = {
  async getMyJobs(): Promise<MyJob[]> {
    // TODO(backend): return apiGet("/me/jobs");
    await mockDelay(400, 900);
    return myJobs;
  },
  async getConversations(): Promise<Conversation[]> {
    // TODO(backend): return apiGet("/me/conversations");
    await mockDelay(400, 900);
    return conversations;
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
  async getThread(id: string): Promise<{ conversation: Conversation | null; messages: ChatMessage[] }> {
    // TODO(backend): return apiGet(`/me/conversations/${id}`);
    await mockDelay(300, 700);
    return {
      conversation: conversations.find((c) => c.id === id) ?? null,
      messages: threads[id] ?? [],
    };
  },
  async getJob(id: string): Promise<MyJob | null> {
    await mockDelay(300, 600);
    return myJobs.find((j) => j.id === id) ?? null;
  },
  async getApplicants(jobId: string): Promise<Applicant[]> {
    // TODO(backend): return apiGet(`/me/jobs/${jobId}/applicants`);
    void jobId;
    await mockDelay(400, 800);
    return applicants;
  },
  async confirmCompletion(jobId: string): Promise<{ ok: true }> {
    // TODO(backend): return apiPost(`/me/jobs/${jobId}/complete`);
    void jobId;
    await mockDelay(500, 900);
    return { ok: true };
  },
  async submitReview(jobId: string, workerId: string, rating: number, text: string): Promise<{ ok: true }> {
    // TODO(backend): return apiPost(`/me/jobs/${jobId}/reviews`, { workerId, rating, text });
    void jobId;
    void workerId;
    void rating;
    void text;
    await mockDelay(500, 900);
    return { ok: true };
  },
  async sendMessage(id: string, text: string): Promise<ChatMessage> {
    // TODO(backend): return apiPost(`/me/conversations/${id}/messages`, { text });
    await mockDelay(300, 600);
    return { id: `m-${Date.now().toString(36)}`, fromMe: true, text, time: "teraz" };
  },
};
