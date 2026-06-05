"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useCookieConsent } from "@/lib/CookieConsentProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { CookieToggles } from "./CookieToggles";
import type { CookiePrefs } from "@/lib/CookieConsentProvider";

export function CookiePolicyScreen() {
  const { t } = useI18n();
  const { prefs, save, reopen } = useCookieConsent();
  const [draft, setDraft] = useState<CookiePrefs>(prefs);

  // Keep the local editor in sync once stored prefs are loaded (deferred to avoid cascading renders).
  useEffect(() => {
    const id = setTimeout(() => setDraft(prefs), 0);
    return () => clearTimeout(id);
  }, [prefs]);

  return (
    <main className="flex-1">
      <div className="border-b border-line bg-surface">
        <div className="mx-auto w-full max-w-[960px] px-4 py-12 sm:px-8">
          <p className="text-[12px] font-bold uppercase tracking-[1px] text-brand-violet">{t("legal.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.5px] text-ink sm:text-4xl">{t("cookies.changePrefs")}</h1>
          <p className="mt-3 max-w-2xl text-[14px] text-ink-2">{t("cookies.subtitle")}</p>
          <Button variant="dark" onClick={reopen} className="mt-5 rounded-tile px-4 py-2.5 text-[13px]">
            {t("cookies.changePrefs")}
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[960px] px-4 py-12 sm:px-8">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[1px] text-ink-4">{t("cookies.sectionTitle")}</p>
        <CookieToggles prefs={draft} onChange={setDraft} />
        <Button variant="dark" onClick={() => save(draft)} className="mt-5 rounded-tile px-6 py-2.5 text-sm">
          {t("cookies.savePrefs")}
        </Button>
      </div>
    </main>
  );
}
