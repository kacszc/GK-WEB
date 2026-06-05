"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DayState } from "@/lib/types";

const stateStyle: Record<DayState, string> = {
  free: "bg-[#eaf7ee] text-[#1b8a3a]",
  booked: "bg-[#efeaff] text-[#6b3df0]",
  blocked: "bg-[#fdecec] text-[#d14343]",
};

function iso(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}-${m < 10 ? "0" : ""}${m}-${day < 10 ? "0" : ""}${day}`;
}

/** Monday-first cells (incl. greyed leading/trailing days) for a month grid. */
function buildGrid(month: Date): { date: Date; inMonth: boolean }[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const lead = (first.getDay() + 6) % 7; // days before the 1st (Mon-first)
  const start = new Date(year, m, 1 - lead);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({ date, inMonth: date.getMonth() === m });
  }
  // Trim the last week if it's entirely in the next month.
  return cells.slice(0, cells[35].inMonth || cells.slice(35).some((c) => c.inMonth) ? 42 : 35);
}

/**
 * Reusable availability calendar (month grid).
 * - Read-only by default; pass `editable` + `onDayClick` to cycle a day's state.
 * - State lookup via the `days` map (ISO date → DayState); unknown days render empty.
 */
export function AvailabilityCalendar({
  month,
  onMonthChange,
  days,
  weekdays,
  labels,
  monthFormatter,
  editable = false,
  onDayClick,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  days: Record<string, DayState>;
  weekdays: string[];
  labels: Record<DayState, string>;
  monthFormatter: (d: Date) => string;
  editable?: boolean;
  onDayClick?: (dateIso: string, current: DayState | undefined) => void;
}) {
  const cells = buildGrid(month);

  return (
    <div className="rounded-panel border border-line-3 bg-surface p-4 sm:p-5">
      {/* Month nav */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          aria-label="prev"
          className="grid h-8 w-8 place-items-center rounded-tile border border-line-2 text-ink hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[140px] text-[15px] font-semibold capitalize text-ink">{monthFormatter(month)}</span>
        <button
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          aria-label="next"
          className="grid h-8 w-8 place-items-center rounded-tile border border-line-2 text-ink hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="mb-1.5 grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekdays.map((w) => (
          <div key={w} className="px-1 text-[11px] font-medium text-ink-4">{w}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map(({ date, inMonth }, i) => {
          if (!inMonth) {
            return (
              <div key={i} className="min-h-[52px] rounded-tile px-2 py-1.5 text-[13px] text-ink-4">
                {date.getDate()}
              </div>
            );
          }
          const key = iso(date);
          const state = days[key];
          const interactive = editable && !!onDayClick;
          return (
            <button
              key={i}
              disabled={!interactive}
              onClick={() => onDayClick?.(key, state)}
              className={cn(
                "min-h-[52px] rounded-tile px-2 py-1.5 text-left transition-transform",
                state ? stateStyle[state] : "bg-muted/50 text-ink",
                interactive && "cursor-pointer hover:scale-[1.03]",
              )}
            >
              <span className="block text-[13px] font-semibold">{date.getDate()}</span>
              {state && <span className="block text-[9px] font-bold tracking-[0.5px]">{labels[state]}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
