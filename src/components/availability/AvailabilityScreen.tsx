"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Toggle } from "@/components/ui/Toggle";
import { inputClass } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { availabilityService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { DayState, RecurringRule } from "@/lib/types";
import { AvailabilityCalendar } from "./AvailabilityCalendar";

const intlTags: Record<Locale, string> = { pl: "pl-PL", en: "en-GB", uk: "uk-UA" };
const STATES: DayState[] = ["free", "booked", "blocked"];
const dotStyle: Record<DayState, string> = { free: "bg-[#1b8a3a]", booked: "bg-[#6b3df0]", blocked: "bg-[#d14343]" };

export function AvailabilityScreen() {
  const { t, dict, locale } = useI18n();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [overrides, setOverrides] = useState<Record<string, DayState | null>>({});
  const [addDayOpen, setAddDayOpen] = useState(false);
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [localRules, setLocalRules] = useState<RecurringRule[]>([]);
  const [removedRuleIds, setRemovedRuleIds] = useState<string[]>([]);
  const ruleId = useRef(0);

  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["availability", month.getFullYear(), month.getMonth()],
    queryFn: () => availabilityService.getMonth(month.getFullYear(), month.getMonth()),
    placeholderData: keepPreviousData,
  });
  // Refresh server state (days + summary) after a write so the calendar and counts stay in sync.
  const refresh = () => qc.invalidateQueries({ queryKey: ["availability"] });

  // Merge server data with local edits (null override = cleared day).
  const daysMap = useMemo(() => {
    const map: Record<string, DayState> = {};
    data?.days.forEach((d) => (map[d.date] = d.state));
    for (const [date, state] of Object.entries(overrides)) {
      if (state === null) delete map[date];
      else map[date] = state;
    }
    return map;
  }, [data, overrides]);

  const rules = useMemo(
    () => [...(data?.rules ?? []), ...localRules].filter((r) => !removedRuleIds.includes(r.id)),
    [data, localRules, removedRuleIds],
  );

  // Job-driven bookings grouped by day (several services may share a day).
  const bookingsByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    (data?.bookings ?? []).forEach((b) => {
      (map[b.date] ??= []).push(b.title);
    });
    return map;
  }, [data]);

  const monthFormatter = (d: Date) =>
    new Intl.DateTimeFormat(intlTags[locale], { month: "long", year: "numeric" }).format(d);

  const labels: Record<DayState, string> = {
    free: t("availability.stateFree"),
    booked: t("availability.stateBooked"),
    blocked: t("availability.stateBlocked"),
  };
  const menuLabels: Record<DayState, string> = {
    free: t("availability.optFree"),
    booked: t("availability.optBooked"),
    blocked: t("availability.optBlocked"),
  };

  function setDay(dateIso: string, state: DayState | null) {
    // Optimistic update for instant feedback, then persist + refetch so the summary/server reconcile.
    setOverrides((o) => ({ ...o, [dateIso]: state }));
    if (state) void availabilityService.setDay(dateIso, state).then(refresh);
  }

  function addRange(from: string, to: string, state: DayState) {
    const next: Record<string, DayState | null> = {};
    const start = new Date(from);
    const end = new Date(to || from);
    const writes: Promise<unknown>[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const key = `${d.getFullYear()}-${m < 10 ? "0" : ""}${m}-${day < 10 ? "0" : ""}${day}`;
      next[key] = state;
      writes.push(availabilityService.setDay(key, state));
    }
    setOverrides((o) => ({ ...o, ...next }));
    void Promise.allSettled(writes).then(refresh);
  }

  async function addRule(rule: Omit<RecurringRule, "id">) {
    ruleId.current += 1;
    // Optimistic insert with a temporary id, then reconcile with the server id.
    const tempId = `local-${ruleId.current}`;
    setLocalRules((rs) => [...rs, { ...rule, id: tempId }]);
    const created = await availabilityService.addRule(rule);
    setLocalRules((rs) => rs.map((r) => (r.id === tempId ? created : r)));
  }

  function removeRule(id: string) {
    setRemovedRuleIds((ids) => [...ids, id]);
    void availabilityService.deleteRule(id);
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
        <Button variant="dark" onClick={() => setAddDayOpen(true)} className="shrink-0 rounded-tile px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" />
          {t("availability.add")}
        </Button>
      </div>

      {!data ? (
        <AvailabilitySkeleton />
      ) : (
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <AvailabilityCalendar
          month={month}
          onMonthChange={setMonth}
          days={daysMap}
          bookings={bookingsByDate}
          weekdays={dict.availability.weekdays}
          labels={labels}
          monthFormatter={monthFormatter}
          editable
          onDayStateChange={setDay}
          menuLabels={menuLabels}
          clearLabel={t("availability.optClear")}
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
              {rules.map((r) => (
                <li key={r.id} className="group flex items-start gap-2.5">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", r.available ? "bg-[#1b8a3a]" : "bg-[#d14343]")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{r.label}</p>
                    <p className="text-[12px] text-ink-4">{r.detail}</p>
                  </div>
                  <button
                    onClick={() => removeRule(r.id)}
                    aria-label={t("availability.deleteRule")}
                    className="opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5 text-ink-4 hover:text-danger" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setAddRuleOpen(true)}
              className="mt-3 w-full rounded-tile border border-dashed border-line-2 py-2 text-[13px] font-medium text-brand-violet hover:bg-muted"
            >
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
      )}

      <AddDayDialog open={addDayOpen} onClose={() => setAddDayOpen(false)} onSave={addRange} menuLabels={menuLabels} />
      <AddRuleDialog open={addRuleOpen} onClose={() => setAddRuleOpen(false)} onSave={addRule} />
    </div>
  );
}

function AddDayDialog({
  open,
  onClose,
  onSave,
  menuLabels,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (from: string, to: string, state: DayState) => void;
  menuLabels: Record<DayState, string>;
}) {
  const { t } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [state, setState] = useState<DayState>("free");

  const input = cn(inputClass(), "mt-1.5");

  function save() {
    if (!from) return;
    onSave(from, to, state);
    onClose();
    setFrom("");
    setTo("");
    setState("free");
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("availability.addDayTitle")}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-semibold text-ink-3">{t("availability.dateFrom")}</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-ink-3">{t("availability.dateTo")}</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={input} />
        </div>
      </div>
      <p className="mb-2 mt-4 text-[12px] font-semibold text-ink-3">{t("availability.statusLabel")}</p>
      <div className="flex gap-2">
        {STATES.map((s) => (
          <button
            key={s}
            onClick={() => setState(s)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-tile border px-3 py-2.5 text-[13px] font-medium transition-colors",
              state === s ? "border-ink bg-ink text-on-dark" : "border-line-2 text-ink hover:bg-muted",
            )}
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", dotStyle[s])} />
            {menuLabels[s]}
          </button>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} className="rounded-tile px-5 py-2.5 text-sm">{t("availability.cancel")}</Button>
        <Button variant="dark" onClick={save} disabled={!from} className="rounded-tile px-5 py-2.5 text-sm disabled:opacity-40">{t("availability.saveBtn")}</Button>
      </div>
    </Dialog>
  );
}

function AddRuleDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (rule: Omit<RecurringRule, "id">) => void;
}) {
  const { t } = useI18n();
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [available, setAvailable] = useState(true);

  const input = "mt-1.5 w-full rounded-tile border border-line-2 bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-ink placeholder:text-ink-4";

  function save() {
    if (!label.trim()) return;
    onSave({ label: label.trim(), detail: detail.trim() || t("availability.optFree"), available });
    onClose();
    setLabel("");
    setDetail("");
    setAvailable(true);
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("availability.addRuleTitle")}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-[12px] font-semibold text-ink-3">{t("availability.ruleLabelField")}</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("availability.ruleLabelPlaceholder")} className={input} />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-ink-3">{t("availability.ruleDetailField")}</label>
          <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder={t("availability.ruleDetailPlaceholder")} className={input} />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-ink">{t("availability.ruleAvailableToggle")}</span>
          <Toggle on={available} onChange={setAvailable} />
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} className="rounded-tile px-5 py-2.5 text-sm">{t("availability.cancel")}</Button>
        <Button variant="dark" onClick={save} disabled={!label.trim()} className="rounded-tile px-5 py-2.5 text-sm disabled:opacity-40">{t("availability.saveBtn")}</Button>
      </div>
    </Dialog>
  );
}

function AvailabilitySkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      {/* Calendar */}
      <div className="rounded-panel border border-line-3 bg-surface p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-8 w-8 rounded-tile" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-8 rounded-tile" />
        </div>
        <div className="mb-1.5 grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-[52px] rounded-tile" />
          ))}
        </div>
      </div>
      {/* Side panels */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 rounded-panel" />
        <Skeleton className="h-44 rounded-panel" />
        <Skeleton className="h-40 rounded-panel" />
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
