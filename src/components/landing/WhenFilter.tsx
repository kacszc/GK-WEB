"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { pl, enUS, uk } from "react-day-picker/locale";
import type { Locale as DateFnsLocale } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { Popover } from "@/components/ui/Popover";
import { FilterTrigger } from "@/components/ui/FilterTrigger";
import { useI18n } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { WhenValue, WhenPreset } from "@/lib/types";

const presetKeys: WhenPreset[] = ["today", "tomorrow", "weekend"];

const dpLocales: Record<Locale, DateFnsLocale> = { pl, en: enUS, uk };
const intlTags: Record<Locale, string> = { pl: "pl-PL", en: "en-GB", uk: "uk-UA" };

export function presetDate(id: WhenPreset): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (id === "tomorrow") d.setDate(d.getDate() + 1);
  if (id === "weekend") {
    const add = (6 - d.getDay() + 7) % 7; // next Saturday
    d.setDate(d.getDate() + add);
  }
  return d;
}

/** A preset resolved to a date range: today/tomorrow are single days, weekend is Sat–Sun. */
export function presetRange(id: WhenPreset): { from: Date; to: Date } {
  const from = presetDate(id);
  if (id === "weekend") {
    const to = new Date(from);
    to.setDate(to.getDate() + 1); // Sunday
    return { from, to };
  }
  return { from, to: from };
}

/** Local "yyyy-mm-dd" (no UTC shift). */
export function whenISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Parse a local "yyyy-mm-dd" to a midnight Date (null on blank/invalid). */
function parseISO(s?: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** ISO from/to strings → WhenValue (used by the filter sidebars, which store ISO strings). */
export function isoToWhen(from?: string, to?: string): WhenValue {
  const f = parseISO(from);
  return { preset: null, from: f, to: parseISO(to) ?? f };
}

/** WhenValue → ISO from/to strings (undefined when nothing selected). */
export function whenToISO(v: WhenValue): { fromDate?: string; toDate?: string } {
  if (!v.from) return { fromDate: undefined, toDate: undefined };
  return { fromDate: whenISO(v.from), toDate: whenISO(v.to ?? v.from) };
}

/** Format a [from, to] range for the trigger ("12 cze" or "12–14 cze"). */
function formatRange(from: Date, to: Date | null, tag: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  if (!to || from.getTime() === to.getTime()) return from.toLocaleDateString(tag, opts);
  return `${from.toLocaleDateString(tag, { day: "numeric" })}–${to.toLocaleDateString(tag, opts)}`;
}

export function WhenFilter({
  value,
  onChange,
  align = "end",
  fullWidth = false,
}: {
  value: WhenValue;
  onChange: (v: WhenValue) => void;
  align?: "start" | "end";
  fullWidth?: boolean;
}) {
  const { t, locale } = useI18n();
  const [month, setMonth] = useState<Date>(value.from ?? new Date());

  const empty = !value.preset && !value.from;
  const displayLabel = value.preset
    ? t(`filters.${value.preset}`)
    : value.from
      ? formatRange(value.from, value.to, intlTags[locale])
      : t("filters.anyWhen");

  return (
    <Popover
      align={align}
      triggerClassName={fullWidth ? "w-full" : undefined}
      trigger={({ open }) => (
        <FilterTrigger
          icon={<CalendarDays className="h-4 w-4 text-ink-3" />}
          label={t("filters.when")}
          value={displayLabel}
          open={open}
          fullWidth={fullWidth}
          placeholder={empty}
        />
      )}
    >
      {({ close }) => (
        <div className="w-[min(320px,calc(100vw-3rem))]">
          <div className="mb-3 flex flex-wrap gap-2">
            {presetKeys.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  const { from, to } = presetRange(id);
                  onChange({ preset: id, from, to });
                  close();
                }}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  value.preset === id
                    ? "border-ink bg-ink text-on-dark"
                    : "border-line-2 text-ink hover:bg-muted",
                )}
              >
                {t(`filters.${id}`)}
              </button>
            ))}
            {!empty && (
              <button
                type="button"
                onClick={() => {
                  onChange({ preset: null, from: null, to: null });
                  close();
                }}
                className="cursor-pointer rounded-full border border-line-2 px-3 py-1.5 text-xs font-semibold text-ink-3 transition-colors hover:bg-muted"
              >
                {t("filters.clearWhen")}
              </button>
            )}
          </div>

          <div className="rdp-skill">
            <DayPicker
              mode="range"
              locale={dpLocales[locale]}
              month={month}
              onMonthChange={setMonth}
              selected={value.from ? { from: value.from, to: value.to ?? value.from } : undefined}
              disabled={{ before: new Date() }}
              onSelect={(range) => {
                onChange({ preset: null, from: range?.from ?? null, to: range?.to ?? range?.from ?? null });
                // Close once a full range (or single day re-click) is chosen.
                if (range?.from && range?.to) close();
              }}
            />
          </div>
        </div>
      )}
    </Popover>
  );
}
