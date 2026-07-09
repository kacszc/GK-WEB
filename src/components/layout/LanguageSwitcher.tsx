"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { useI18n } from "@/i18n/I18nProvider";
import { locales, localeNames, localeFlags, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";

const ONE_YEAR = 60 * 60 * 24 * 365;

function persistLocale(next: string) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function LanguageSwitcher() {
  const { locale } = useI18n();
  const router = useRouter();

  function pick(next: string) {
    persistLocale(next);
    router.refresh();
  }

  return (
    <Popover
      align="end"
      panelClassName="p-1.5"
      trigger={({ open }) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-line-2 bg-pill px-3 py-2 text-xs font-semibold text-ink transition-colors",
            open ? "ring-2 ring-ink/10" : "hover:bg-line-2",
          )}
        >
          <span aria-hidden className="text-sm leading-none">{localeFlags[locale as Locale]}</span>
          {locale.toUpperCase()}
        </span>
      )}
    >
      {({ close }) => (
        <ul className="w-44">
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                onClick={() => {
                  pick(l);
                  close();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-tile px-3 py-2 text-sm transition-colors hover:bg-muted cursor-pointer",
                  l === locale ? "font-semibold text-ink" : "text-ink-2",
                )}
              >
                <span aria-hidden className="text-base leading-none">{localeFlags[l]}</span>
                <span className="flex-1 text-left">{localeNames[l]}</span>
                {l === locale && <Check className="h-4 w-4 text-brand-violet" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}
