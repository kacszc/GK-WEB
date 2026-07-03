"use client";

import Link from "next/link";
import { MessagesBell } from "@/components/layout/MessagesBell";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Mobile-header auth controls. Signed in → messages + notifications shortcuts (matching the
 * account/search top bars). Logged out → a compact "Log in" button so the entry point is visible
 * without opening the hamburger menu (register still lives in the menu).
 */
export function HeaderMobileAuth() {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  if (!ready) return null;
  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center rounded-full border border-line-2 bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink transition-colors hover:bg-muted"
      >
        {t("nav.login")}
      </Link>
    );
  }
  return (
    <>
      <MessagesBell />
      <NotificationBell />
    </>
  );
}
