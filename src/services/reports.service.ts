import type { ReportsData } from "@/lib/types";
import { apiGet } from "@/lib/api-client";

export const reportsService = {
  async getReports(): Promise<ReportsData> {
    return apiGet<ReportsData>("/api/me/reports");
  },
};
