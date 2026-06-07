import type { PortfolioItem, LinkableJob } from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api-client";

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
  status: "SELF" | "VERIFIED";
  photoCount: number;
  colors: string[];
  linkedJobId: string | null;
  createdAt: string;
};

/** Completed-job card from GET /api/me/jobs/completed (subset of the search projection). */
type JobCardDto = {
  id: string;
  title: string;
  district: string | null;
  createdAt: string | null;
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
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    location: v.location,
    date: displayDate(v.date),
    status: v.status === "VERIFIED" ? "verified" : "self",
    photoCount: v.photoCount,
    colors: v.colors?.length ? v.colors : ["#5b4636"],
    linkedJob: undefined,
  };
}

export const portfolioService = {
  /** Existing portfolio entries of the current specialist. */
  async getPortfolio(): Promise<PortfolioItem[]> {
    const views = await apiGet<PortfolioItemView[]>("/api/me/portfolio");
    return views.map(toPortfolioItem);
  },

  /** Public portfolio of a specialist (shown on the public profile). */
  async getPublicPortfolio(userId: string): Promise<PortfolioItem[]> {
    const views = await apiGet<PortfolioItemView[]>(
      `/api/specialists/${encodeURIComponent(userId)}/portfolio`,
    );
    return views.map(toPortfolioItem);
  },

  /** Completed jobs the worker can link a realisation to (unlocks confirmation). */
  async getLinkableJobs(): Promise<LinkableJob[]> {
    const views = await apiGet<JobCardDto[]>("/api/me/jobs/completed");
    // The card projection carries no employer name (cross-schema join would break module
    // boundaries), so we surface the district as the location hint instead.
    return views.map((v) => ({
      id: v.id,
      title: v.title,
      employer: v.district ?? "",
      date: displayDate(v.createdAt),
    }));
  },

  /**
   * Submit a new portfolio entry. The API has no file storage yet, so we send metadata only
   * (title/description/location/date/linkedJobId); the server derives photoCount/colors and the
   * status (SELF, or VERIFIED when linked to a completed job the specialist actually did).
   */
  async upload(draft: PortfolioDraft): Promise<PortfolioItem> {
    const title = draft.description.slice(0, 40) || "Realizacja";
    const view = await apiPost<PortfolioItemView>("/api/me/portfolio", {
      title,
      description: draft.description,
      location: draft.location,
      date: toIsoDate(draft.date),
      linkedJobId: draft.linkedJobId,
    });
    return toPortfolioItem(view);
  },
};
