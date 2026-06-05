"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DayState } from "@/lib/types";

const stateStyle: Record<DayState, string> = {
  free: "bg-[#eaf7ee] text-[#1b8a3a]",
  booked: "bg-[#efeaff] text-[#6b3df0]",
  blocked: "bg-[#fdecec] text-[#d14343]",
};
const dotStyle: Record<DayState, string> = {
  free: "bg-[#1b8a3a]",
  booked: "bg-[#6b3df0]",
  blocked: "bg-[#d14343]",
};
const STATES: DayState[] = ["free", "booked", "blocked"];

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
  const lead = (first.getDay() + 6) % 7;
  const start = new Date(year, m, 1 - lead);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({ date, inMonth: date.getMonth() === m });
  }
  return cells.slice(0, cells.slice(35).some((c) => c.inMonth) ? 42 : 35);
}

/**
 * Reusable availability calendar (month grid).
 * - Read-only by default; pass `editable` + `onDayStateChange` to edit a day via a small popover menu.
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
  onDayStateChange,
  menuLabels,
  clearLabel,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  days: Record<string, DayState>;
  weekdays: string[];
  labels: Record<DayState, string>;
  monthFormatter: (d: Date) => string;
  editable?: boolean;
  onDayStateChange?: (dateIso: string, state: DayState | null) => void;
  menuLabels?: Record<DayState, string>;
  clearLabel?: string;
}) {
  const cells = buildGrid(month);
  const [openDay, setOpenDay] = useState<string | null>(null);

  function choose(dateIso: string, state: DayState | null) {
    onDayStateChange?.(dateIso, state);
    setOpenDay(null);
  }

  return (
    <div className="relative rounded-panel border border-line-3 bg-surface p-4 sm:p-5">
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

      {/* Backdrop to dismiss the day menu */}
      {openDay && <div className="fixed inset-0 z-20" onClick={() => setOpenDay(null)} />}

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
          const interactive = editable && !!onDayStateChange;
          const isOpen = openDay === key;
          const lastCols = i % 7 >= 5; // anchor menu to the right edge for Sat/Sun
          return (
            <div key={i} className="relative">
              <button
                disabled={!interactive}
                onClick={() => setOpenDay(isOpen ? null : key)}
                className={cn(
                  "min-h-[52px] w-full rounded-tile px-2 py-1.5 text-left transition-transform",
                  state ? stateStyle[state] : "bg-muted/50 text-ink",
                  interactive && "cursor-pointer hover:scale-[1.03]",
                  isOpen && "ring-2 ring-ink/40",
                )}
              >
                <span className="block text-[13px] font-semibold">{date.getDate()}</span>
                {state && <span className="block text-[9px] font-bold tracking-[0.5px]">{labels[state]}</span>}
              </button>

              {/* Per-day menu */}
              {interactive && isOpen && menuLabels && (
                <div
                  className={cn(
                    "absolute top-full z-30 mt-1 w-40 animate-pop-in rounded-tile border border-line-2 bg-surface p-1 shadow-dropdown",
                    lastCols ? "right-0" : "left-0",
                  )}
                >
                  {STATES.map((s) => (
                    <button
                      key={s}
                      onClick={() => choose(key, s)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-soft px-2.5 py-2 text-left text-[12px] font-medium hover:bg-muted",
                        state === s ? "text-ink" : "text-ink-2",
                      )}
                    >
                      <span className={cn("h-2.5 w-2.5 rounded-full", dotStyle[s])} />
                      {menuLabels[s]}
                      {state === s && <span className="ml-auto text-ink-4">✓</span>}
                    </button>
                  ))}
                  {state && clearLabel && (
                    <>
                      <span className="my-1 block h-px bg-line" />
                      <button
                        onClick={() => choose(key, null)}
                        className="flex w-full items-center gap-2 rounded-soft px-2.5 py-2 text-left text-[12px] font-medium text-ink-3 hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                        {clearLabel}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
