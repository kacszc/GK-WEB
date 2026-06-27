"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { UserCog, X } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { accountService } from "@/services";
import type { MySpecialistProfile, MyEmployerProfile } from "@/services";

// How often the nudge reappears after the user hides it (ms). Gentle, not nagging.
const REMINDER_INTERVAL = 30 * 60_000; // 30 min
const DISMISS_KEY = "profileNudgeDismissedAt";
// Routes where nudging would be noise (already completing, or signed-out flows).
const HIDDEN_PREFIXES = ["/onboarding", "/login", "/register"];

/**
 * Periodic top-right reminder for signed-in users whose profile isn't complete. Re-appears every
 * {@link REMINDER_INTERVAL} after being dismissed. Role-aware: specialists vs employers.
 */
export function ProfileNudge() {
  const { user, ready } = useAuth();
  const role = user?.role;
  const { t, locale } = useI18n();
  const pathname = usePathname();
  // Current time + last-dismiss are kept in state (never read Date.now()/localStorage during render).
  // Initial reads are deferred to an async callback to avoid the set-state-in-effect lint (same
  // pattern as AuthProvider's seed).
  const [now, setNow] = useState<number | null>(null);
  const [dismissedAt, setDismissedAt] = useState(0);

  useEffect(() => {
    const init = setTimeout(() => {
      setDismissedAt(Number(safeGet(DISMISS_KEY) ?? 0));
      setNow(Date.now());
    }, 0);
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      clearTimeout(init);
      clearInterval(id);
    };
  }, []);

  const signedIn = ready && !!user;
  const { data, isLoading } = useQuery({
    queryKey: ["profileCompleteness", role, locale],
    queryFn: (): Promise<MySpecialistProfile | MyEmployerProfile | null> =>
      role === "employer"
        ? accountService.getMyEmployerProfile(locale)
        : accountService.getMySpecialistProfile(locale),
    enabled: signedIn,
    staleTime: 5 * 60_000,
  });

  if (!signedIn || isLoading || now === null) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  // Incomplete = no role profile yet, or (specialist) not enough data to publish / (employer) no name.
  const incomplete =
    role === "employer"
      ? !data || !(data as { name?: string }).name?.trim()
      : !data || (data as { complete?: boolean }).complete === false;
  if (!incomplete) return null;

  // Respect a recent dismissal.
  if (dismissedAt && now - dismissedAt < REMINDER_INTERVAL) return null;

  const dismiss = () => {
    const ts = now;
    safeSet(DISMISS_KEY, String(ts));
    setDismissedAt(ts); // re-render → hides via the window check
  };

  return (
    <div className="fixed right-4 top-20 z-50 w-[300px] max-w-[calc(100vw-2rem)] animate-fade-up">
      <div className="relative rounded-panel border border-line-3 bg-surface p-4 shadow-[0_10px_30px_-8px_rgba(16,24,40,0.18),-12px_6px_28px_-14px_rgba(16,24,40,0.14)]">
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("profileNudge.dismiss")}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-ink-4 hover:bg-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 pr-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eef1ff] text-brand-violet">
            <UserCog className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink">{t("profileNudge.title")}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-ink-3">
              {t(role === "employer" ? "profileNudge.descEmployer" : "profileNudge.descSpecialist")}
            </p>
            <Link
              // Specialist: resume mode → prefills + jumps to the unfilled step (no full restart).
              href={role === "employer" ? "/onboarding/employer" : "/onboarding/specialist?resume=1"}
              onClick={dismiss}
              className="mt-2.5 inline-flex rounded-tile bg-ink px-3 py-1.5 text-[12px] font-semibold text-on-dark hover:bg-ink/90"
            >
              {t("profileNudge.cta")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore (private mode / storage disabled)
  }
}
