import { apiGet } from "@/lib/api-client";

/** A live, already-localized announcement (backend resolves the copy per Accept-Language). */
export type Announcement = {
  code: string;
  level: string; // info | warning | success
  message: string;
  ctaHref: string | null;
  ctaLabel: string | null;
};

export const contentService = {
  /** Active site announcements, newest-positioned first, localized to `locale`. */
  async getAnnouncements(locale?: string): Promise<Announcement[]> {
    return apiGet<Announcement[]>("/api/content/announcements", { locale });
  },
};
