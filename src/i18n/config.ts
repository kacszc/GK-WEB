export const locales = ["pl", "en", "uk"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pl";

export const localeNames: Record<Locale, string> = {
  pl: "Polski",
  en: "English",
  uk: "Українська",
};

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Pick the best supported locale from an Accept-Language header value. */
export function matchLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;
  const preferred = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase());
  for (const tag of preferred) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}
