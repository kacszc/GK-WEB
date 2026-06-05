// import { apiGet } from "@/lib/api-client";
import { mockDelay } from "./mock-data";

export const messagesService = {
  /** Send a contact message to a specialist (mock). */
  async send(specialistId: string, text: string): Promise<{ ok: true }> {
    // TODO(backend): return apiPost(`/specialists/${specialistId}/messages`, { text });
    void specialistId;
    void text;
    await mockDelay(600, 1100);
    return { ok: true };
  },
};
