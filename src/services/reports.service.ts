import type { ReportsData } from "@/lib/types";
import { apiGet } from "@/lib/api-client";
import { mockDelay } from "./mock-data";

const data: ReportsData = {
  kpis: [
    { id: "hires", value: "47", label: "Zatrudnień", delta: "+22% vs poprzedni okres" },
    { id: "tokens", value: "184", label: "Wydane tokeny", delta: "33 kontakt/zlecenie" },
    { id: "tth", value: "1.8 dnia", label: "Średni time-to-hire", delta: "↓ 0.6 dnia" },
    { id: "trust", value: "85", label: "Śr. Trust wybranych", delta: "powyżej mediany" },
  ],
  hiresOverTime: [
    { label: "Sty", value: 5 },
    { label: "Lut", value: 7 },
    { label: "Mar", value: 9 },
    { label: "Kwi", value: 11 },
    { label: "Maj", value: 15 },
  ],
  history: [
    { id: "h1", name: "Anna K.", avatarIndex: 0, trustScore: 92, job: "Barman event 150 osób", date: "16.05", rate: 330, rating: 5 },
    { id: "h2", name: "Marta L.", avatarIndex: 2, trustScore: 84, job: "Kelner śniadania weekend", date: "10–11.05", rate: 504, rating: 5 },
    { id: "h3", name: "Tomasz P.", avatarIndex: 1, trustScore: 89, job: "Kucharz event firmowy", date: "12.04", rate: 780, rating: 5 },
    { id: "h4", name: "Krzysztof W.", avatarIndex: 5, trustScore: 87, job: "Barman gala", date: "22.04", rate: 440, rating: 4 },
    { id: "h5", name: "Iryna S.", avatarIndex: 11, trustScore: 81, job: "Kelnerka śniadania", date: "28–31.03", rate: 420, rating: 5 },
  ],
  funnel: [
    { label: "Publikacje zlecenia", value: 14, pct: 100 },
    { label: "Otrzymane zgłoszenia", value: 184, pct: 92 },
    { label: "Kontakt (token wydany)", value: 68, pct: 49 },
    { label: "Wybrany kandydat", value: 51, pct: 36 },
    { label: "Zlecenie ukończone", value: 47, pct: 34 },
  ],
  repeatHireRate: 72,
  disputesOpened: 0,
};

export const reportsService = {
  async getReports(): Promise<ReportsData> {
    try {
      return await apiGet<ReportsData>("/api/me/reports");
    } catch {
      await mockDelay();
      return data;
    }
  },
};
