"use client";

import { useQuery } from "@tanstack/react-query";
import { Toggle } from "@/components/ui/Toggle";
import { legalService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import type { CookiePrefs } from "@/lib/CookieConsentProvider";

/** Reusable cookie-category list. Essential is always on. */
export function CookieToggles({
  prefs,
  onChange,
}: {
  prefs: CookiePrefs;
  onChange: (prefs: CookiePrefs) => void;
}) {
  const { t } = useI18n();
  const { data: categories = [] } = useQuery({
    queryKey: ["cookieCategories"],
    queryFn: legalService.getCookieCategories,
  });

  function valueFor(id: string): boolean {
    if (id === "essential") return true;
    return prefs[id as keyof CookiePrefs] ?? false;
  }

  return (
    <div className="flex flex-col gap-3">
      {categories.map((c) => (
        <div key={c.id} className="flex items-start gap-4 rounded-panel border border-line-3 bg-surface p-4">
          <Toggle
            on={valueFor(c.id)}
            disabled={c.required}
            onChange={(v) => onChange({ ...prefs, [c.id]: v })}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-ink">{c.name}</span>
              {c.required && (
                <span className="rounded-full bg-pill px-1.5 py-0.5 text-[10px] font-bold tracking-[0.5px] text-ink-3">
                  {t("cookies.required")}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[13px] text-ink-2">{c.description}</p>
            <p className="mt-1 text-[11px] text-ink-4">
              {t("cookies.durationLabel")} {c.duration} &nbsp;·&nbsp; {t("cookies.examplesLabel")} {c.examples}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
