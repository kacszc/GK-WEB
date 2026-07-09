"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Settings, Briefcase, MessageSquare, Bookmark, Clock, Coins, ImageIcon, CalendarDays, BarChart3, Scale, BellRing, Bell, Send, Award, UserCog, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

type Role = "employer" | "specialist";
type Item = { href: string; key: string; icon: typeof LayoutGrid; role?: Role };

// Grouped nav: the handful of daily-use items stay top-level, profile/billing get
// small labelled groups, and rarely-visited pages collapse under "More" so the
// menu stops scaring first-time (and foreign-language) users.
const main: Item[] = [
  { href: "/account", key: "account.navOverview", icon: LayoutGrid },
  { href: "/account/jobs", key: "account.navJobs", icon: Briefcase, role: "employer" },
  { href: "/account/applications", key: "applications.navTitle", icon: Send, role: "specialist" },
  { href: "/account/messages", key: "account.navMessages", icon: MessageSquare },
  { href: "/account/availability", key: "availability.eyebrow", icon: CalendarDays, role: "specialist" },
  { href: "/account/contacts", key: "account.navContacts", icon: Bookmark, role: "employer" },
];

const profileGroup: Item[] = [
  { href: "/account/profile", key: "account.navProfile", icon: UserCog, role: "specialist" },
  { href: "/account/portfolio", key: "portfolio.title", icon: ImageIcon, role: "specialist" },
  { href: "/account/certifications", key: "certifications.navTitle", icon: Award, role: "specialist" },
];

const paymentsGroup: Item[] = [
  { href: "/account/tokens", key: "tokens.walletTitle", icon: Coins, role: "employer" },
  { href: "/account/reports", key: "reports.title", icon: BarChart3, role: "employer" },
];

const moreGroup: Item[] = [
  { href: "/account/notifications", key: "notifications.title", icon: Bell },
  { href: "/account/alerts", key: "alerts.navTitle", icon: BellRing, role: "specialist" },
  { href: "/account/specialist-alerts", key: "specialistAlerts.navTitle", icon: BellRing, role: "employer" },
  { href: "/account/disputes", key: "dispute.listTitle", icon: Scale },
  { href: "/account/history", key: "account.navHistory", icon: Clock },
];

const bottom: Item[] = [{ href: "/account/settings", key: "account.navSettings", icon: Settings }];

const forRole = (items: Item[], role?: Role) => items.filter((it) => !it.role || it.role === role);

export function AccountSidebar() {
  const { t } = useI18n();
  const { user } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  const vMain = forRole(main, user?.role);
  const vProfile = forRole(profileGroup, user?.role);
  const vPayments = forRole(paymentsGroup, user?.role);
  const vMore = forRole(moreGroup, user?.role);

  // "More" is collapsed by default; it force-opens (derived, no effect) while the
  // current page lives inside it, so the active item is never hidden.
  const [moreOpenManual, setMoreOpenManual] = useState(false);
  const moreOpen = moreOpenManual || vMore.some((it) => isActive(it.href));

  const navRef = useRef<HTMLElement | null>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  // On mobile the sidebar is a horizontal scroller; bring the active item into view so the
  // selection is visible after navigating (e.g. to "Settings" at the far right).
  useEffect(() => {
    const nav = navRef.current;
    if (nav && activeRef.current && nav.scrollWidth > nav.clientWidth) {
      activeRef.current.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }, [pathname]);

  const link = ({ href, key, icon: Icon }: Item) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        ref={active ? activeRef : undefined}
        href={href}
        className={cn(
          "flex shrink-0 items-center gap-2.5 rounded-tile px-3 py-2.5 text-sm font-medium transition-colors",
          active ? "bg-ink text-on-dark" : "text-ink-2 hover:bg-muted hover:text-ink",
        )}
      >
        <Icon className="h-4 w-4" />
        {t(key)}
      </Link>
    );
  };

  const groupLabel = (key: string) => (
    <p className="mt-3 hidden px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-ink-3 lg:block">
      {t(key)}
    </p>
  );

  return (
    <nav ref={navRef} className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
      {vMain.map(link)}

      {vProfile.length > 0 && (
        <>
          {groupLabel("account.navGroupProfile")}
          {vProfile.map(link)}
        </>
      )}

      {vPayments.length > 0 && (
        <>
          {groupLabel("account.navGroupPayments")}
          {vPayments.map(link)}
        </>
      )}

      {/* On mobile (horizontal scroller) "More" items are always inline — a toggle
          inside a scroll row would be awkward. Collapsing applies on desktop only. */}
      <button
        type="button"
        onClick={() => setMoreOpenManual((o) => !o)}
        aria-expanded={moreOpen}
        className="mt-3 hidden items-center gap-1 px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-ink-3 transition-colors hover:text-ink lg:flex cursor-pointer"
      >
        {t("account.navMore")}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", moreOpen && "rotate-180")} />
      </button>
      <div className={cn("contents lg:flex lg:flex-col lg:gap-0.5", !moreOpen && "lg:hidden")}>
        {vMore.map(link)}
      </div>

      <div className="contents lg:mt-3 lg:flex lg:flex-col lg:border-t lg:border-line lg:pt-2">
        {bottom.map(link)}
      </div>
    </nav>
  );
}
