"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { locales, localeNames, localeFlags, LOCALE_COOKIE } from "@/i18n/config";
import { cn } from "@/lib/cn";

const ONE_YEAR = 60 * 60 * 24 * 365;

function persistLocale(next: string) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

/**
 * Inline flag row (no dropdown) — all languages visible at a glance so
 * non-Polish speakers instantly see the site speaks their language.
 */
export function LanguageSwitcher() {
  const { locale } = useI18n();
  const router = useRouter();

  function pick(next: string) {
    if (next === locale) return;
    persistLocale(next);
    router.refresh();
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-0.5 rounded-full border border-line-2 bg-pill p-0.5"
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => pick(l)}
          aria-label={localeNames[l]}
          aria-pressed={l === locale}
          title={localeNames[l]}
          className={cn(
            "inline-flex h-7 w-8 cursor-pointer items-center justify-center rounded-full text-base leading-none transition-all",
            l === locale
              ? "bg-surface shadow-sm ring-1 ring-line-2"
              : "opacity-55 grayscale-[35%] hover:opacity-100 hover:grayscale-0",
          )}
        >
          <span aria-hidden>{localeFlags[l]}</span>
        </button>
      ))}
    </div>
  );
}
