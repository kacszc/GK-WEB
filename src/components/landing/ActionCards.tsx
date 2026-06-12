"use client";

import { Search, MapPinned, Plus, CalendarCheck, UserRound } from "lucide-react";
import { ActionCard, type CardTheme } from "./ActionCard";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/AuthProvider";

type Card = { theme: CardTheme; href: string; icon: typeof Search; titleKey: string; descKey: string; ctaKey: string };

// Employer / visitor: find specialists, map, post a job.
const EMPLOYER_CARDS: Card[] = [
  { theme: "light", href: "/search", icon: Search, titleKey: "actions.searchTitle", descKey: "actions.searchDesc", ctaKey: "actions.searchCta" },
  { theme: "gradient", href: "/search?view=map", icon: MapPinned, titleKey: "actions.mapTitle", descKey: "actions.mapDesc", ctaKey: "actions.mapCta" },
  { theme: "dark", href: "/post-job", icon: Plus, titleKey: "actions.jobTitle", descKey: "actions.jobDesc", ctaKey: "actions.jobCta" },
];

// Specialist (supply side): browse jobs, stay available, keep the profile (their offer) complete.
const SPECIALIST_CARDS: Card[] = [
  { theme: "light", href: "/jobs", icon: Search, titleKey: "actions.specSearchTitle", descKey: "actions.specSearchDesc", ctaKey: "actions.specSearchCta" },
  { theme: "gradient", href: "/account/availability", icon: CalendarCheck, titleKey: "actions.specAvailTitle", descKey: "actions.specAvailDesc", ctaKey: "actions.specAvailCta" },
  { theme: "dark", href: "/account/settings", icon: UserRound, titleKey: "actions.specProfileTitle", descKey: "actions.specProfileDesc", ctaKey: "actions.specProfileCta" },
];

export function ActionCards() {
  const { t } = useI18n();
  const { user } = useAuth();
  const cards = user?.role === "specialist" ? SPECIALIST_CARDS : EMPLOYER_CARDS;

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-8">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-[22px] font-bold tracking-[-0.5px] text-ink">{t("actions.heading")}</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-chip px-3 py-1 text-[11px] font-semibold tracking-[0.5px] text-success-chip-text">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
          {t("actions.liveBadge", { count: 247 })}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <ActionCard
            key={c.href}
            theme={c.theme}
            href={c.href}
            icon={<c.icon className={c.theme === "light" ? "h-7 w-7 text-ink" : "h-7 w-7 text-on-dark"} />}
            title={t(c.titleKey)}
            desc={t(c.descKey)}
            cta={t(c.ctaKey)}
          />
        ))}
      </div>
    </section>
  );
}
