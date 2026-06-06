import type { Notification } from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api-client";

export const notificationsService = {
  /** Unread badge count. Returns 0 on failure / signed out. */
  async unreadCount(): Promise<number> {
    try {
      const dto = await apiGet<{ count: number }>("/api/notifications/unread-count");
      return dto.count ?? 0;
    } catch {
      return 0;
    }
  },

  /** Inbox list. Returns [] on failure / signed out. */
  async list(): Promise<Notification[]> {
    try {
      return await apiGet<Notification[]>("/api/notifications");
    } catch {
      return [];
    }
  },

  /** Mark a single notification as read. */
  async markRead(id: string): Promise<void> {
    await apiPost(`/api/notifications/${encodeURIComponent(id)}/read`);
  },

  /** Mark all notifications as read. */
  async markAllRead(): Promise<void> {
    await apiPost("/api/notifications/read-all");
  },
};
