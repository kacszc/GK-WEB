"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { HeaderAuth } from "@/components/layout/HeaderAuth";
import { useI18n } from "@/i18n/I18nProvider";

/** Account sections → breadcrumb label key, matched by longest path prefix. */
const SECTIONS: { prefix: string; key: string }[] = [
  { prefix: "/account/jobs", key: "account.navJobs" },
  { prefix: "/account/messages", key: "account.navMessages" },
  { prefix: "/account/contacts", key: "account.navContacts" },
  { prefix: "/account/portfolio", key: "portfolio.title" },
  { prefix: "/account/availability", key: "availability.eyebrow" },
  { prefix: "/account/reports", key: "reports.title" },
  { prefix: "/account/disputes", key: "dispute.listTitle" },
  { prefix: "/account/tokens", key: "tokens.walletTitle" },
  { prefix: "/account/history", key: "account.navHistory" },
  { prefix: "/account/settings", key: "account.navSettings" },
  { prefix: "/account/notifications", key: "notifications.pageTitle" },
];

/**
 * Top bar for the signed-in account area. Unlike the search top bar, the breadcrumb reflects the
 * current route, and the right side is the real auth-wired controls (wallet, notifications, menu).
 */
export function AccountTopbar() {
  const { t } = useI18n();
  const pathname = usePathname();

  const section = SECTIONS
    .filter((s) => pathname === s.prefix || pathname.startsWith(s.prefix + "/"))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  return (
    <header className="pt-safe sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>
          <nav className="hidden min-w-0 items-center gap-1.5 text-[13px] text-ink-3 md:flex">
            <Link href="/" className="hover:text-ink">
              {t("results.breadcrumbHome")}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-ink-4" />
            {section ? (
              <>
                <Link href="/account" className="hover:text-ink">
                  {t("account.navOverview")}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-ink-4" />
                <span className="truncate font-medium text-ink">{t(section.key)}</span>
              </>
            ) : (
              <span className="truncate font-medium text-ink">{t("account.navOverview")}</span>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
