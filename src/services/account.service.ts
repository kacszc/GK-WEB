import type { MyJob, Conversation, SavedContact, ActivityItem, ChatMessage } from "@/lib/types";
// import { apiGet } from "@/lib/api-client";
import { myJobs, conversations, savedContacts, activity, threads } from "./mock-account";
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
  async sendMessage(id: string, text: string): Promise<ChatMessage> {
    // TODO(backend): return apiPost(`/me/conversations/${id}/messages`, { text });
    await mockDelay(300, 600);
    return { id: `m-${Date.now().toString(36)}`, fromMe: true, text, time: "teraz" };
  },
};
