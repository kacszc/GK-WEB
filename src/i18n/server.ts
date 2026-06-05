import "server-only";
import { cookies, headers } from "next/headers";
import { isLocale, matchLocale, LOCALE_COOKIE, type Locale } from "./config";
import { getDictionary, type Dictionary } from "./dictionaries";
import { translate, type TFunction } from "./translate";

/** Resolve the active locale: cookie override first, then Accept-Language header. */
export async function getLocale(): Promise<Locale> {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;
  return matchLocale((await headers()).get("accept-language"));
}

/** Server-side i18n helper for Server Components. */
export async function getI18n(): Promise<{
  locale: Locale;
  dict: Dictionary;
  t: TFunction;
}> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t: TFunction = (key, params) => translate(dict, key, params);
  return { locale, dict, t };
}
