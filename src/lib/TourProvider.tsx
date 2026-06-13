"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PlatformTour, type TourAction } from "@/components/onboarding/PlatformTour";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import type { UserRole } from "@/lib/types";

const seenKey = (role: UserRole) => `skill_tour_seen_${role}`;
/** Pages where the tour may auto-open for a first-time signed-in user (logged-in "home" surfaces). */
const HOME_PATHS = new Set(["/", "/account"]);

type TourContextValue = { open: () => void };
const TourContext = createContext<TourContextValue | null>(null);

/**
 * Mounts the platform tour once (app-wide). It auto-opens ONCE per role the first time a signed-in
 * user lands on the landing or /account — so it shows whether or not they finished onboarding, and
 * even if they bailed mid-way. `open()` re-launches it manually (e.g. the /account guide button).
 * The final card carries the role-appropriate next step (employer → post a job, specialist → publish).
 */
export function TourProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const role: UserRole = user?.role === "employer" ? "employer" : "specialist";

  useEffect(() => {
    if (!ready || !user || typeof window === "undefined") return;
    if (HOME_PATHS.has(pathname) && !localStorage.getItem(seenKey(role))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
    }
  }, [pathname, ready, user, role]);

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined") localStorage.setItem(seenKey(role), "1");
  };

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
