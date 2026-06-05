import type { Locale } from "../config";
import pl, { type Dictionary } from "./pl";
import en from "./en";
import uk from "./uk";

export const dictionaries: Record<Locale, Dictionary> = { pl, en, uk };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
