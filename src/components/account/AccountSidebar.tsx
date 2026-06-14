"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Settings, Briefcase, MessageSquare, Bookmark, Clock, Coins, ImageIcon, CalendarDays, BarChart3, Scale, BellRing, Bell, Send, Award } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

const items = [
  { href: "/account", key: "account.navOverview", icon: LayoutGrid },
  { href: "/account/notifications", key: "notifications.title", icon: Bell },
  { href: "/account/jobs", key: "account.navJobs", icon: Briefcase, role: "employer" as const },
  { href: "/account/applications", key: "applications.navTitle", icon: Send, role: "specialist" as const },
  { href: "/account/messages", key: "account.navMessages", icon: MessageSquare },
  { href: "/account/contacts", key: "account.navContacts", icon: Bookmark, role: "employer" as const },
  { href: "/account/portfolio", key: "portfolio.title", icon: ImageIcon, role: "specialist" as const },
  { href: "/account/certifications", key: "certifications.navTitle", icon: Award, role: "specialist" as const },
  { href: "/account/availability", key: "availability.eyebrow", icon: CalendarDays, role: "specialist" as const },
  { href: "/account/alerts", key: "alerts.navTitle", icon: BellRing, role: "specialist" as const },
  { href: "/account/specialist-alerts", key: "specialistAlerts.navTitle", icon: BellRing, role: "employer" as const },
  { href: "/account/reports", key: "reports.title", icon: BarChart3, role: "employer" as const },
  { href: "/account/disputes", key: "dispute.listTitle", icon: Scale },
  { href: "/account/tokens", key: "tokens.walletTitle", icon: Coins, role: "employer" as const },
  { href: "/account/history", key: "account.navHistory", icon: Clock },
  { href: "/account/settings", key: "account.navSettings", icon: Settings },
];

export function AccountSidebar() {
  const { t } = useI18n();
  const { user } = useAuth();
  const pathname = usePathname();
  const visible = items.filter((it) => !it.role || it.role === user?.role);

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
      {visible.map(({ href, key, icon: Icon }) => {
        const active = href === "/account" ? pathname === "/account" : pathname.startsWith(href);
        return (
          <Link
            key={href}
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
      })}
    </nav>
  );
}
