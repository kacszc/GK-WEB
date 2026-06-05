"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Settings, Briefcase, MessageSquare, Bookmark, Clock } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

const items = [
  { href: "/account", key: "account.navOverview", icon: LayoutGrid },
  { href: "/account/jobs", key: "account.navJobs", icon: Briefcase },
  { href: "/account/messages", key: "account.navMessages", icon: MessageSquare },
  { href: "/account/contacts", key: "account.navContacts", icon: Bookmark },
  { href: "/account/history", key: "account.navHistory", icon: Clock },
  { href: "/account/settings", key: "account.navSettings", icon: Settings },
];

export function AccountSidebar() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
      {items.map(({ href, key, icon: Icon }) => {
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
