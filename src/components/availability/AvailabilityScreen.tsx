"use client";

import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { availabilityService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { DayState } from "@/lib/types";
import { AvailabilityCalendar } from "./AvailabilityCalendar";

const intlTags: Record<Locale, string> = { pl: "pl-PL", en: "en-GB", uk: "uk-UA" };
const nextState: Record<DayState, DayState> = { free: "booked", booked: "blocked", blocked: "free" };

export function AvailabilityScreen() {
  const { t, dict, locale } = useI18n();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [overrides, setOverrides] = useState<Record<string, DayState>>({});

  const { data } = useQuery({
    queryKey: ["availability", month.getFullYear(), month.getMonth()],
    queryFn: () => availabilityService.getMonth(month.getFullYear(), month.getMonth()),
    placeholderData: keepPreviousData,
  });

  // Merge server data with local edits for instant feedback.
  const daysMap = useMemo(() => {
    const map: Record<string, DayState> = {};
    data?.days.forEach((d) => (map[d.date] = d.state));
    return { ...map, ...overrides };
  }, [data, overrides]);

  const monthFormatter = (d: Date) =>
    new Intl.DateTimeFormat(intlTags[locale], { month: "long", year: "numeric" }).format(d);

  const labels: Record<DayState, string> = {
    free: t("availability.stateFree"),
    booked: t("availability.stateBooked"),
    blocked: t("availability.stateBlocked"),
  };

  function cycleDay(dateIso: string, current: DayState | undefined) {
    const next = current ? nextState[current] : "free";
    setOverrides((o) => ({ ...o, [dateIso]: next }));
    void availabilityService.setDay(dateIso, next);
  }

  const summary = data?.summary;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[1px] text-ink-4">{t("availability.eyebrow")}</p>
          <h1 className="mt-1 text-2xl font-bold capitalize tracking-[-0.5px] text-ink">{monthFormatter(month)}</h1>
          <p className="mt-1 text-[13px] text-ink-3">{t("availability.subtitle")}</p>
        </div>
        <Button variant="dark" className="shrink-0 rounded-tile px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" />
          {t("availability.add")}
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <AvailabilityCalendar
          month={month}
          onMonthChange={setMonth}
          days={daysMap}
          weekdays={dict.availability.weekdays}
          labels={labels}
          monthFormatter={monthFormatter}
          editable
          onDayClick={cycleDay}
        />

        <div className="flex flex-col gap-4">
          {/* Legend */}
          <div className="rounded-panel border border-line-3 bg-surface p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.5px] text-ink-4">{t("availability.legendTitle")}</p>
            <ul className="flex flex-col gap-2 text-[13px] text-ink-2">
              <LegendRow color="bg-[#eaf7ee]" border="border-[#bfe6c9]" label={t("availability.legendFree")} />
              <LegendRow color="bg-[#efeaff]" border="border-[#d6c9ff]" label={t("availability.legendBooked")} />
              <LegendRow color="bg-[#fdecec]" border="border-[#f4c9c9]" label={t("availability.legendBlocked")} />
            </ul>
          </div>

          {/* Recurring rules */}
          <div className="rounded-panel border border-line-3 bg-surface p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.5px] text-ink-4">{t("availability.recurringTitle")}</p>
            <ul className="flex flex-col gap-3">
              {data?.rules.map((r) => (
                <li key={r.id} className="flex items-start gap-2.5">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", r.available ? "bg-[#1b8a3a]" : "bg-[#d14343]")} />
                  <div>
                    <p className="text-[13px] font-medium text-ink">{r.label}</p>
                    <p className="text-[12px] text-ink-4">{r.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button className="mt-3 w-full rounded-tile border border-dashed border-line-2 py-2 text-[13px] font-medium text-brand-violet hover:bg-muted">
              + {t("availability.addRule")}
            </button>
          </div>

          {/* Summary */}
          {summary && (
            <div className="rounded-panel bg-ink p-4 text-on-dark">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.5px] text-brand-violet">
                <span className="capitalize">{monthFormatter(month)}</span> · {t("availability.summaryTitle")}
              </p>
              <dl className="flex flex-col gap-2 text-[13px]">
                <SumRow label={t("availability.sumFree")} value={summary.free} />
                <SumRow label={t("availability.sumBooked")} value={summary.booked} />
                <SumRow label={t("availability.sumBlocked")} value={summary.blocked} />
                <SumRow label={t("availability.sumJobs")} value={summary.jobsDone} />
                <SumRow label={t("availability.sumEarnings")} value={`${summary.estimatedEarnings.toLocaleString("pl-PL")} zł`} />
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, border, label }: { color: string; border: string; label: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className={cn("h-4 w-4 rounded border", color, border)} />
      {label}
    </li>
  );
}

function SumRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-on-dark/70">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}
