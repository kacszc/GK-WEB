import type { MyJob, Conversation, SavedContact, ActivityItem } from "@/lib/types";
// import { apiGet } from "@/lib/api-client";
import { myJobs, conversations, savedContacts, activity } from "./mock-account";
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
};
