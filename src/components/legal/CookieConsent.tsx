"use client";

import { useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCookieConsent } from "@/lib/CookieConsentProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { CookieToggles } from "./CookieToggles";
import type { CookiePrefs } from "@/lib/CookieConsentProvider";

/** Bottom cookie consent banner. Mounted globally; shows until the user decides. */
export function CookieConsent() {
  const { t } = useI18n();
  const { bannerOpen, prefs, acceptAll, rejectAll, save } = useCookieConsent();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<CookiePrefs>(prefs);

  if (!bannerOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] p-3 sm:p-4">
      <div className="mx-auto w-full max-w-[1100px] animate-fade-up rounded-card border border-line bg-ink p-5 text-on-dark shadow-dropdown">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-[#ffcf6b]" />
            <div>
              <p className="text-sm font-bold">{t("cookies.bannerTitle")}</p>
              <p className="mt-0.5 max-w-xl text-[13px] text-on-dark/75">{t("cookies.bannerDesc")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:shrink-0">
            <Button variant="outline" onClick={rejectAll} className="rounded-tile px-4 py-2 text-[13px]">
              {t("cookies.onlyEssential")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDraft(prefs);
                setExpanded((v) => !v);
              }}
              className="rounded-tile px-4 py-2 text-[13px]"
            >
              {t("cookies.customize")}
            </Button>
            <Button variant="white" onClick={acceptAll} className="rounded-tile px-4 py-2 text-[13px]">
              {t("cookies.acceptAll")}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 border-t border-on-dark/10 pt-4">
            <div className="rounded-panel bg-surface p-1">
              <CookieToggles prefs={draft} onChange={setDraft} />
            </div>
            <Button
              variant="white"
              onClick={() => save(draft)}
              className="mt-3 w-full rounded-tile py-2.5 text-sm sm:w-auto sm:px-6"
            >
              {t("cookies.savePrefs")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
