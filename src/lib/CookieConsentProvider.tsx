"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "skill_cookie_consent";

export type CookiePrefs = {
  performance: boolean;
  functional: boolean;
  marketing: boolean;
};

const ALL_ON: CookiePrefs = { performance: true, functional: true, marketing: true };
const ALL_OFF: CookiePrefs = { performance: false, functional: false, marketing: false };

type CookieConsentValue = {
  prefs: CookiePrefs;
  decided: boolean;
  bannerOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (prefs: CookiePrefs) => void;
  reopen: () => void;
};

const CookieConsentContext = createContext<CookieConsentValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<CookiePrefs>(ALL_OFF);
  const [decided, setDecided] = useState(true); // assume decided until storage is read (avoids flash)
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { prefs: CookiePrefs };
          setPrefs(parsed.prefs ?? ALL_OFF);
          setDecided(true);
        } else {
          setDecided(false);
          setBannerOpen(true);
        }
      } catch {
        setDecided(false);
        setBannerOpen(true);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  function persist(next: CookiePrefs) {
    setPrefs(next);
    setDecided(true);
    setBannerOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ prefs: next, decidedAt: new Date().toISOString() }));
    } catch {
      // ignore
    }
  }

  const value: CookieConsentValue = {
    prefs,
    decided,
    bannerOpen,
    acceptAll: () => persist(ALL_ON),
    rejectAll: () => persist(ALL_OFF),
    save: (p) => persist(p),
    reopen: () => setBannerOpen(true),
  };

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent(): CookieConsentValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
}
