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
  const [month, setMonth] = useState<Date>(value.date ?? new Date());

  const empty = !value.preset && !value.date;
  const displayLabel = value.preset
    ? t(`filters.${value.preset}`)
    : value.date
      ? value.date.toLocaleDateString(intlTags[locale], { day: "numeric", month: "short" })
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
        <div className="w-[min(300px,calc(100vw-3rem))]">
          <div className="mb-3 flex flex-wrap gap-2">
            {presetKeys.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onChange({ preset: id, date: presetDate(id) });
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
          </div>

          <div className="rdp-skill">
            <DayPicker
              mode="single"
              locale={dpLocales[locale]}
              month={month}
              onMonthChange={setMonth}
              selected={value.date ?? undefined}
              disabled={{ before: new Date() }}
              onSelect={(d) => {
                if (d) {
                  onChange({ preset: null, date: d });
                  close();
                }
              }}
            />
          </div>
        </div>
      )}
    </Popover>
  );
}
