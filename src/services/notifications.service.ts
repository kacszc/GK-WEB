import type { Notification } from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api-client";

/** A backend page of notifications + totals (newest first). */
export type NotificationPage = {
  items: Notification[];
  total: number;
  unread: number;
  page: number;
  size: number;
};

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

  /** Inbox list (full). Returns [] on failure / signed out. Used by the bell/toaster. */
  async list(): Promise<Notification[]> {
    try {
      return await apiGet<Notification[]>("/api/notifications");
    } catch {
      return [];
    }
  },

  /** One backend page of the inbox (newest first) + totals. Empty page on failure / signed out. */
  async listPage(page: number, size: number): Promise<NotificationPage> {
    try {
      return await apiGet<NotificationPage>(
        `/api/notifications/page?page=${page}&size=${size}`,
      );
    } catch {
      return { items: [], total: 0, unread: 0, page, size };
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
