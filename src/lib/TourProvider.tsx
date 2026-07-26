"use client";

import { createContext, useContext, useState } from "react";
import { PlatformTour, type TourAction } from "@/components/onboarding/PlatformTour";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import type { UserRole } from "@/lib/types";

type TourContextValue = { open: () => void };
const TourContext = createContext<TourContextValue | null>(null);

/**
 * Mounts the platform tour once (app-wide). Opt-in only: `open()` launches it (the /account
 * "Przewodnik" button); it never auto-opens. The final card carries the role-appropriate next
 * step (employer → post a job, specialist → publish).
 */
export function TourProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const role: UserRole = user?.role === "employer" ? "employer" : "specialist";

  // The tour NEVER auto-opens (stakeholder feedback: a forced multi-slide walkthrough is a chore
  // and localStorage-based "seen once" made it look inconsistent across devices). It's opt-in
  // only, via the dashboard "Przewodnik" button (`open()`).
  const close = () => setOpen(false);

  const finishActions: TourAction[] =
    role === "employer"
      ? [
          { label: t("account.quickSearch"), href: "/search" },
          { label: t("account.quickPost"), href: "/post-job", primary: true },
        ]
      : [
          { label: t("nav.findWork"), href: "/jobs" },
          { label: t("offer.publish"), href: "/account", primary: true },
        ];

  return (
    <TourContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      {ready && user && (
        <PlatformTour open={open} onClose={close} role={role} finishActions={finishActions} />
      )}
    </TourContext.Provider>
  );
}

/** Open the platform tour from anywhere (no-op outside the provider). */
export function useTour(): TourContextValue {
  return useContext(TourContext) ?? { open: () => {} };
}
