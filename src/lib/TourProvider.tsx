"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PlatformTour, type TourAction } from "@/components/onboarding/PlatformTour";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import type { UserRole } from "@/lib/types";

/** Set by the onboarding success screen; the provider opens the tour on the next page the user lands on. */
const PENDING_KEY = "skill_tour_pending";

type TourContextValue = { open: () => void };
const TourContext = createContext<TourContextValue | null>(null);

/**
 * Mounts the platform tour once (app-wide) and exposes `open()` so it can be triggered from anywhere
 * (e.g. the header menu). After onboarding we don't show it on the onboarding screen — instead a
 * "pending" flag is set, and the tour opens on the next page the user navigates to.
 */
export function TourProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const role: UserRole = user?.role === "employer" ? "employer" : "specialist";

  // Open once on the destination after onboarding (a route change clears the pending flag).
  useEffect(() => {
    if (!ready || !user || typeof window === "undefined") return;
    if (localStorage.getItem(PENDING_KEY)) {
      localStorage.removeItem(PENDING_KEY);
      // Legitimate: react to a route change + external (localStorage) flag set during onboarding.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
    }
  }, [pathname, ready, user]);

  const finishActions: TourAction[] =
    role === "employer"
      ? [
          { label: t("account.quickSearch"), href: "/search" },
          { label: t("account.quickPost"), href: "/post-job", primary: true },
        ]
      : [
          { label: t("nav.findWork"), href: "/jobs" },
          { label: t("account.navOverview"), href: "/account", primary: true },
        ];

  return (
    <TourContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      {ready && user && (
        <PlatformTour open={open} onClose={() => setOpen(false)} role={role} finishActions={finishActions} />
      )}
    </TourContext.Provider>
  );
}

/** Open the platform tour from anywhere (no-op outside the provider). */
export function useTour(): TourContextValue {
  return useContext(TourContext) ?? { open: () => {} };
}

/** Mark the tour to open on the next page (called when onboarding completes). */
export function markTourPending() {
  if (typeof window !== "undefined") localStorage.setItem(PENDING_KEY, "1");
}
