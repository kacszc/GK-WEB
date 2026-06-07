import { apiGet, apiPut } from "@/lib/api-client";

/** Notification consents + contact phone (persisted account settings). */
export type NotificationSettings = {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
  phone: string | null;
};

/** One entry in the GDPR consent-change history. */
export type ConsentChange = {
  channel: "EMAIL" | "PUSH" | "SMS" | "MARKETING";
  enabled: boolean;
  changedAt: string;
};

const DEFAULTS: NotificationSettings = { email: true, push: true, sms: false, marketing: false, phone: null };

export const settingsService = {
  /** Load the current user's settings (defaults if not signed in / backend down). */
  async get(): Promise<NotificationSettings> {
    try {
      return await apiGet<NotificationSettings>("/api/me/settings");
    } catch {
      return DEFAULTS;
    }
  },

  /** Persist settings; returns the saved state. */
  async update(settings: NotificationSettings): Promise<NotificationSettings> {
    return apiPut<NotificationSettings>("/api/me/settings", settings);
  },

  /** GDPR consent-change history, newest first. */
  async history(): Promise<ConsentChange[]> {
    try {
      return await apiGet<ConsentChange[]>("/api/me/consents/history");
    } catch {
      return [];
    }
  },
};
