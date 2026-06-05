"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/pl";
import { translate, type TFunction } from "./translate";

type I18nContextValue = { locale: Locale; dict: Dictionary; t: TFunction };

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(
    () => ({ locale, dict, t: (key, params) => translate(dict, key, params) }),
    [locale, dict],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
