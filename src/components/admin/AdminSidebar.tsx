"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Library } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

// CMS sections. More slices (plans, content, moderation) get appended here as they land.
const items = [
  { href: "/admin", key: "admin.navOverview", icon: LayoutGrid },
  { href: "/admin/catalog", key: "admin.navCatalog", icon: Library },
];

export function AdminSidebar() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
      {items.map(({ href, key, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
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
