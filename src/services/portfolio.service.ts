import type { PortfolioItem, LinkableJob } from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api-client";
import { mockDelay } from "./mock-data";
import { portfolioItems, linkableJobs } from "./mock-account";

/** Draft of a new portfolio entry submitted from the upload dialog. */
export type PortfolioDraft = {
  fileNames: string[];
  description: string;
  location: string;
  date: string;
  linkedJobId: string | null;
};

// --- Backend DTO ----------------------------------------------------------

type PortfolioItemView = {
  id: string;
  userId: string;
  title: string;
  description: string;
  location: string;
  date: string | null;
  status: "PENDING" | "VERIFIED";
  photoCount: number;
  colors: string[];
  linkedJobId: string | null;
  createdAt: string;
};

/** Format an ISO date (YYYY-MM-DD) for display; pass through anything else. */
function displayDate(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Convert a free-form date (e.g. "12.04.2026") to ISO YYYY-MM-DD or null. */
function toIsoDate(date: string): string | null {
  if (!date.trim()) return null;
  const dotted = date.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dotted) return `${dotted[3]}-${dotted[2]}-${dotted[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function toPortfolioItem(v: PortfolioItemView): PortfolioItem {
  const linked = v.linkedJobId
    ? linkableJobs.find((j) => j.id === v.linkedJobId)?.employer
    : undefined;
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    location: v.location,
    date: displayDate(v.date),
    status: v.status === "VERIFIED" ? "verified" : "pending",
    photoCount: v.photoCount,
    colors: v.colors?.length ? v.colors : ["#5b4636"],
    linkedJob: linked,
  };
}

export const portfolioService = {
  /** Existing portfolio entries of the current specialist. */
  async getPortfolio(): Promise<PortfolioItem[]> {
    try {
      const views = await apiGet<PortfolioItemView[]>("/api/me/portfolio");
      return views.map(toPortfolioItem);
    } catch {
      await mockDelay();
      return portfolioItems;
    }
  },

  /** Public portfolio of a specialist (shown on the public profile). */
  async getPublicPortfolio(userId: string): Promise<PortfolioItem[]> {
    try {
      const views = await apiGet<PortfolioItemView[]>(
        `/api/specialists/${encodeURIComponent(userId)}/portfolio`,
      );
      return views.map(toPortfolioItem);
    } catch {
      return [];
    }
  },

  /** Completed jobs the worker can link a realisation to (unlocks confirmation). */
  async getLinkableJobs(): Promise<LinkableJob[]> {
    // TODO(backend): return apiGet("/api/me/jobs/completed");
    await mockDelay(200, 500);
    return linkableJobs;
  },

  /**
   * Submit a new portfolio entry. The API has no file storage yet, so we send
   * metadata only (title/description/location/date/linkedJobId); the server
   * derives `photoCount`/`colors`. Linked entries start "pending".
   */
  async upload(draft: PortfolioDraft): Promise<PortfolioItem> {
    const linked = draft.linkedJobId
      ? linkableJobs.find((j) => j.id === draft.linkedJobId)
      : undefined;
    const title = linked?.title ?? (draft.description.slice(0, 40) || "Realizacja");
    try {
      const view = await apiPost<PortfolioItemView>("/api/me/portfolio", {
        title,
        description: draft.description,
        location: draft.location,
        date: toIsoDate(draft.date),
        linkedJobId: draft.linkedJobId,
      });
      return toPortfolioItem(view);
    } catch {
      // TODO(backend): file upload needs storage — only metadata is sent today.
      await mockDelay(900, 1500);
      return {
        id: `pf-${draft.fileNames.length}-${draft.date}`,
        title,
        description: draft.description,
        location: draft.location,
        date: draft.date,
        status: "pending",
        photoCount: draft.fileNames.length,
        colors: ["#5b4636", "#c47b35", "#4f6b58"].slice(0, Math.max(1, draft.fileNames.length)),
        linkedJob: linked?.employer,
      };
    }
  },
};
