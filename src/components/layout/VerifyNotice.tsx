"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

/** Routes that handle verification inline (their own step) — no banner there. */
const BANNER_HIDDEN_ON = ["/login", "/register", "/onboarding"];

/**
 * Inactive-account notice for users whose email isn't verified yet. Renders
 * nothing for verified / signed-out users.
 * - `banner`: full-width sticky bar at the top of the app (mounted in layout).
 * - `panel`: inline card used to block a specific action (post a job, contact).
 */
export function VerifyNotice({
  variant = "panel",
  message,
  className,
}: {
  variant?: "banner" | "panel";
  message?: string;
  className?: string;
}) {
  const { user, sendVerificationEmail, reloadUser } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const [checking, setChecking] = useState(false);
  const [resent, setResent] = useState(false);

  const needs = !!user && !user.emailVerified;
  const hideBanner = variant === "banner" && BANNER_HIDDEN_ON.some((p) => pathname.startsWith(p));

  // Poll while the notice is up so it disappears once the link is clicked.
  useEffect(() => {
    if (!needs) return;
    const id = setInterval(() => {
      void reloadUser();
    }, 15000);
    return () => clearInterval(id);
  }, [needs, reloadUser]);

  if (!needs || hideBanner) return null;

  async function recheck() {
    setChecking(true);
    try {
      await reloadUser();
    } finally {
      setChecking(false);
    }
  }

  async function resend() {
    setResent(true);
    await sendVerificationEmail();
  }

  const actions = (
    <>
      <button
        onClick={recheck}
        disabled={checking}
        className="inline-flex items-center gap-1.5 rounded-tile bg-ink px-3 py-1.5 text-[12px] font-semibold text-on-dark transition-colors hover:bg-ink/90 disabled:opacity-60"
      >
        {checking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {checking ? t("verify.checking") : t("verify.recheck")}
      </button>
      <button
        onClick={resend}
        disabled={resent}
        className="inline-flex items-center rounded-tile px-3 py-1.5 text-[12px] font-semibold text-ink underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
      >
        {resent ? t("verify.resent") : t("verify.resend")}
      </button>
    </>
  );

  if (variant === "banner") {
    return (
      <div className={cn("w-full border-b border-[#e7c200] bg-[#fff7d6]", className)}>
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="flex items-start gap-2 text-[13px] text-ink">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#b07400]" />
            <span>
              {/* Mobile: title on line 1, description on line 2. Desktop: inline with a dash. */}
              <span className="font-semibold">{t("verify.bannerTitle")}</span>
              <span className="hidden sm:inline">{" — "}</span>
              <span className="block sm:inline">{t("verify.bannerDesc")}</span>
            </span>
          </p>
          <div className="flex shrink-0 items-center justify-center gap-2 sm:justify-start">{actions}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-tile border border-[#e7c200] bg-[#fff7d6] p-4 text-center",
        className,
      )}
    >
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white">
        <AlertTriangle className="h-5 w-5 text-[#b07400]" />
      </span>
      <p className="mt-2 text-sm font-semibold text-ink">{t("verify.noticeTitle")}</p>
      <p className="mt-1 text-[13px] text-ink-2">{message ?? t("verify.noticePostJob")}</p>
      <div className="mt-3 flex items-center justify-center gap-2">{actions}</div>
    </div>
  );
}
