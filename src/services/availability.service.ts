import type { AvailabilityMonth, AvailabilityDay, DayState } from "@/lib/types";
// import { apiGet, apiPost } from "@/lib/api-client";
import { mockDelay } from "./mock-data";

const rules = [
  { id: "r1", label: "Pn–Pt: 16:00–23:00", detail: "Dostępny", available: true },
  { id: "r2", label: "Sob: 14:00–02:00 (nast.)", detail: "Dostępny", available: true },
  { id: "r3", label: "Niedziele", detail: "Wolne", available: false },
  { id: "r4", label: "Święta", detail: "Wolne", available: false },
];

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// Deterministic demo pattern so the same month always renders the same states.
function stateFor(year: number, month: number, day: number): DayState {
  const dow = new Date(year, month, day).getDay(); // 0 Sun … 6 Sat
  if (dow === 0) return "blocked";
  if ((day + dow) % 6 === 0) return "booked";
  if (day % 11 === 0) return "blocked";
  return "free";
}

export const availabilityService = {
  /** Availability for a given month (month is 0-based). */
  async getMonth(year: number, month: number): Promise<AvailabilityMonth> {
    // TODO(backend): return apiGet(`/me/availability?year=${year}&month=${month + 1}`);
    await mockDelay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: AvailabilityDay[] = [];
    let free = 0;
    let booked = 0;
    let blocked = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const state = stateFor(year, month, d);
      if (state === "free") free++;
      else if (state === "booked") booked++;
      else blocked++;
      days.push({ date: `${year}-${pad(month + 1)}-${pad(d)}`, state });
    }
    return {
      days,
      rules,
      summary: { free, booked, blocked, jobsDone: 3, estimatedEarnings: booked * 370 },
    };
  },

  /** Update a single day's state. */
  async setDay(date: string, state: DayState): Promise<{ ok: true }> {
    // TODO(backend): return apiPost("/me/availability/day", { date, state });
    void date;
    void state;
    await mockDelay(200, 500);
    return { ok: true };
  },
};
