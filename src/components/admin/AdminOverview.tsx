"use client";

import Link from "next/link";
import { Library, Coins, Megaphone, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

/** CMS landing — links to the available sections; greyed cards mark slices not built yet. */
export function AdminOverview() {
  const { t } = useI18n();
  const cards = [
    { href: "/admin/catalog", icon: Library, title: t("admin.navCatalog"), desc: t("admin.catalog.subtitle"), ready: true },
    { href: "#", icon: Coins, title: t("admin.navPlans"), desc: t("admin.soon"), ready: false },
    { href: "#", icon: Megaphone, title: t("admin.navContent"), desc: t("admin.soon"), ready: false },
    { href: "#", icon: ShieldCheck, title: t("admin.navModeration"), desc: t("admin.soon"), ready: false },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("admin.title")}</h1>
        <p className="mt-1 text-[13px] text-ink-3">{t("admin.subtitle")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => {
          const Inner = (
            <>
              <c.icon className="h-6 w-6 text-brand-violet" />
              <p className="mt-3 text-[15px] font-semibold text-ink">{c.title}</p>
              <p className="mt-1 text-[13px] text-ink-3">{c.desc}</p>
            </>
          );
          return c.ready ? (
            <Link
              key={c.title}
              href={c.href}
              className="rounded-panel border border-line-3 bg-surface p-5 transition-colors hover:border-ink"
            >
              {Inner}
            </Link>
          ) : (
            <div key={c.title} className="rounded-panel border border-dashed border-line-2 bg-muted/40 p-5 opacity-70">
              {Inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
