import type { LiveStat } from "@/lib/types";
// import { apiGet } from "@/lib/api-client";
import { liveStats, mockDelay } from "./mock-data";

export const statsService = {
  /** Live stats ("Now on skill.com"). */
  async getLiveStats(): Promise<LiveStat[]> {
    // TODO(backend): return apiGet("/stats/live");  // later also via WebSocket
    await mockDelay();
    return liveStats;
  },
};
