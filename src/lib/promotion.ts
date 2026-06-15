import type { Locale } from "@/i18n/config";

const intlTags: Record<Locale, string> = { pl: "pl-PL", en: "en-GB", uk: "uk-UA" };

/** True while a paid promotion is still active (end date in the future). */
export function isPromoted(promotedUntil?: string | null): boolean {
  if (!promotedUntil) return false;
  const end = new Date(promotedUntil).getTime();
  return Number.isFinite(end) && end > Date.now();
}

/** Localized "until" date for an active promotion (day + month + year). */
export function formatPromotedUntil(promotedUntil: string, locale: Locale): string {
  return new Date(promotedUntil).toLocaleDateString(intlTags[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
