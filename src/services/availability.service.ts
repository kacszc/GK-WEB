import type { AvailabilityMonth, AvailabilityDay, DayState, RecurringRule } from "@/lib/types";
import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api-client";
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

// --- Enum mapping: backend FREE/BOOKED/BLOCKED ↔ frontend free/booked/blocked.

const STATE_TO_ENUM: Record<DayState, string> = {
  free: "FREE",
  booked: "BOOKED",
  blocked: "BLOCKED",
};
function stateFromEnum(s: string): DayState {
  switch (s?.toUpperCase()) {
    case "BOOKED":
      return "booked";
    case "BLOCKED":
      return "blocked";
    default:
      return "free";
  }
}

// --- Backend DTOs ---------------------------------------------------------

type DayDto = { date: string; state: string };
type RuleDto = { id: string; label: string; detail: string; available: boolean };
type MonthDto = {
  days: DayDto[];
  rules: RuleDto[];
  summary: {
    free: number;
    booked: number;
    blocked: number;
    jobsDone: number;
    estimatedEarnings: number;
  };
};

function toMonth(dto: MonthDto): AvailabilityMonth {
  return {
    days: dto.days.map((d) => ({ date: d.date, state: stateFromEnum(d.state) })),
    rules: dto.rules,
    summary: dto.summary,
  };
}

function mockMonth(year: number, month: number): AvailabilityMonth {
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
}

export const availabilityService = {
  /** Availability for a given month (`month` is 0-based; the API is 1-based). */
  async getMonth(year: number, month: number): Promise<AvailabilityMonth> {
    try {
      const dto = await apiGet<MonthDto>(`/api/me/availability?year=${year}&month=${month + 1}`);
      return toMonth(dto);
    } catch {
      await mockDelay();
      return mockMonth(year, month);
    }
  },

  /** Upsert a single day's state (called from the calendar day menu). */
  async setDay(date: string, state: DayState): Promise<{ ok: true }> {
    try {
      await apiPut("/api/me/availability/day", { date, state: STATE_TO_ENUM[state] });
    } catch {
      await mockDelay(200, 500);
    }
    return { ok: true };
  },

  /** Add a recurring rule; returns the created rule (with its server id). */
  async addRule(rule: Omit<RecurringRule, "id">): Promise<RecurringRule> {
    try {
      return await apiPost<RecurringRule>("/api/me/availability/rules", rule);
    } catch {
      await mockDelay(200, 500);
      return { ...rule, id: `local-${Date.now().toString(36)}` };
    }
  },

  /** Delete a recurring rule by id. */
  async deleteRule(id: string): Promise<{ ok: true }> {
    try {
      await apiDelete(`/api/me/availability/rules/${encodeURIComponent(id)}`);
    } catch {
      await mockDelay(200, 500);
    }
    return { ok: true };
  },
};
