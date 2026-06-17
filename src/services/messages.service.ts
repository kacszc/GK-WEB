import type { Conversation, ChatMessage } from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api-client";

// --- Backend DTOs ---------------------------------------------------------

/** A chat thread summary (inbox list). `counterpartyName` may be null. */
type ThreadDto = {
  threadId: string;
  counterpartyId: string;
  counterpartyName: string | null;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unread: number;
  jobId: string | null;
  jobTitle: string | null;
};

/** A single message inside a thread. */
export type MessageView = {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  mine: boolean;
  createdAt: string;
};

/** Full thread detail (marks the thread read server-side). */
type ThreadDetailDto = {
  threadId: string;
  counterpartyId: string;
  counterpartyName: string | null;
  jobId: string | null;
  jobTitle: string | null;
  messages: MessageView[];
  hasMore: boolean;
};

/** A page of older messages (ascending) loaded on scroll-up. */
type MessagePageDto = { messages: MessageView[]; hasMore: boolean };

// --- Adapters -------------------------------------------------------------

/**
 * Graceful counterparty label: the backend leaves `counterpartyName` null for
 * now, so fall back to a short id-based handle ("Użytkownik #abcd1234") rather
 * than crashing. UI copy stays Polish to match the rest of the app.
 */
function counterpartyLabel(name: string | null, id: string): string {
  if (name && name.trim()) return name.trim();
  const short = id ? id.slice(0, 8) : "";
  return short ? `Użytkownik #${short}` : "Użytkownik";
}

/** Relative time label from an ISO timestamp (graceful on bad input). */
function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (mins < 1) return "teraz";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} godz.`;
  const days = Math.floor(hours / 24);
  return `${days} dni`;
}

function clockTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function toConversation(d: ThreadDto): Conversation {
  return {
    id: d.threadId,
    name: counterpartyLabel(d.counterpartyName, d.counterpartyId),
    avatarIndex: 0,
    role: "",
    lastMessage: d.lastMessageText ?? "",
    time: timeAgo(d.lastMessageAt),
    unread: d.unread ?? 0,
    jobId: d.jobId ?? undefined,
    jobTitle: d.jobTitle ?? undefined,
  };
}

export function toChatMessage(m: MessageView): ChatMessage {
  return { id: m.id, fromMe: m.mine, text: m.text, time: clockTime(m.createdAt), createdAt: m.createdAt };
}

export const messagesService = {
  /**
   * Start (or continue) a conversation with a user by id. Creates the thread on first contact.
   * Returns the thread id so the caller can navigate to the live conversation.
   */
  async send(recipientId: string, text: string, jobId?: string): Promise<{ ok: true; threadId: string }> {
    const view = await apiPost<MessageView>("/api/messages", { recipientId, text, jobId });
    return { ok: true, threadId: view.threadId };
  },

  /** Inbox thread list. */
  async getThreads(): Promise<Conversation[]> {
    const dtos = await apiGet<ThreadDto[]>("/api/messages/threads");
    return dtos.map(toConversation);
  },

  /** Open a thread (marks it read server-side): header + latest page of messages + hasMore (older). */
  async getThread(
    id: string,
  ): Promise<{ conversation: Conversation | null; messages: ChatMessage[]; hasMore: boolean }> {
    const dto = await apiGet<ThreadDetailDto>(`/api/messages/threads/${encodeURIComponent(id)}`);
    return {
      conversation: {
        id: dto.threadId,
        name: counterpartyLabel(dto.counterpartyName, dto.counterpartyId),
        avatarIndex: 0,
        role: "",
        lastMessage: "",
        time: "",
        unread: 0,
        jobId: dto.jobId ?? undefined,
        jobTitle: dto.jobTitle ?? undefined,
      },
      messages: dto.messages.map(toChatMessage),
      hasMore: dto.hasMore ?? false,
    };
  },

  /** Load the page of older messages before {@code beforeIso} (scroll-up history). */
  async getOlderMessages(
    threadId: string,
    beforeIso: string,
  ): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
    const dto = await apiGet<MessagePageDto>(
      `/api/messages/threads/${encodeURIComponent(threadId)}/messages?before=${encodeURIComponent(beforeIso)}`,
    );
    return { messages: dto.messages.map(toChatMessage), hasMore: dto.hasMore ?? false };
  },

  /** Post a message to an existing thread. Returns the created message (UI shape). */
  async sendToThread(threadId: string, text: string): Promise<ChatMessage> {
    return toChatMessage(await apiPost<MessageView>("/api/messages", { threadId, text }));
  },
};
