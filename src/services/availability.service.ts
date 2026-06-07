import type { AvailabilityMonth, DayState, RecurringRule } from "@/lib/types";
import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api-client";

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
  bookings?: { date: string; title: string }[];
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
    bookings: dto.bookings ?? [],
    summary: dto.summary,
  };
}

export const availabilityService = {
  /** Availability for a given month (`month` is 0-based; the API is 1-based). */
  async getMonth(year: number, month: number): Promise<AvailabilityMonth> {
    return toMonth(await apiGet<MonthDto>(`/api/me/availability?year=${year}&month=${month + 1}`));
  },

  /** Upsert a single day's state (called from the calendar day menu). */
  async setDay(date: string, state: DayState): Promise<{ ok: true }> {
    await apiPut("/api/me/availability/day", { date, state: STATE_TO_ENUM[state] });
    return { ok: true };
  },

  /** Add a recurring rule; returns the created rule (with its server id). */
  async addRule(rule: Omit<RecurringRule, "id">): Promise<RecurringRule> {
    return apiPost<RecurringRule>("/api/me/availability/rules", rule);
  },

  /** Delete a recurring rule by id. */
  async deleteRule(id: string): Promise<{ ok: true }> {
    await apiDelete(`/api/me/availability/rules/${encodeURIComponent(id)}`);
    return { ok: true };
  },
};
