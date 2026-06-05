import type { PortfolioItem, LinkableJob } from "@/lib/types";
// import { apiGet, apiPost } from "@/lib/api-client";
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

export const portfolioService = {
  /** Existing portfolio entries of the current specialist. */
  async getPortfolio(): Promise<PortfolioItem[]> {
    // TODO(backend): return apiGet("/me/portfolio");
    await mockDelay();
    return portfolioItems;
  },

  /** Completed jobs the worker can link a realisation to (unlocks confirmation). */
  async getLinkableJobs(): Promise<LinkableJob[]> {
    // TODO(backend): return apiGet("/me/jobs/completed");
    await mockDelay(200, 500);
    return linkableJobs;
  },

  /** Upload a new portfolio entry. Linked entries start "pending" until the employer confirms. */
  async upload(draft: PortfolioDraft): Promise<PortfolioItem> {
    // TODO(backend): return apiPost("/me/portfolio", draft);
    await mockDelay(900, 1500);
    const linked = draft.linkedJobId
      ? linkableJobs.find((j) => j.id === draft.linkedJobId)
      : undefined;
    return {
      id: `pf-${draft.fileNames.length}-${draft.date}`,
      title: linked?.title ?? (draft.description.slice(0, 40) || "Realizacja"),
      description: draft.description,
      location: draft.location,
      date: draft.date,
      status: "pending",
      photoCount: draft.fileNames.length,
      colors: ["#5b4636", "#c47b35", "#4f6b58"].slice(0, Math.max(1, draft.fileNames.length)),
      linkedJob: linked?.employer,
    };
  },
};
