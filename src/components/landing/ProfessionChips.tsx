"use client";

import Link from "next/link";
import { CountChip } from "@/components/ui/CountChip";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/AuthProvider";
import type { Profession } from "@/lib/types";

export function ProfessionChips({ items }: { items: Profession[] }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const specialist = user?.role === "specialist";
  // Specialists browse jobs in a category; employers (and visitors) search for specialists.
  const base = specialist ? "/jobs" : "/search";

  // Backend returned nothing for this section — don't render it.
  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pb-6 pt-4 sm:px-8">
      <p className="mb-4 text-center text-[11px] font-semibold tracking-[0.8px] text-ink-3">
        {t(specialist ? "chips.headingSpecialist" : "chips.heading")}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {items.map((p, i) => (
          <Link
            key={p.code ?? p.label}
            href={p.code ? `${base}?profession=${encodeURIComponent(p.code)}` : `${base}?q=${encodeURIComponent(p.label)}`}
            style={{ animationDelay: `${i * 25}ms` }}
            className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-line-2 bg-surface px-3.5 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-sm"
          >
            <span className="text-[13px] font-semibold text-ink">{p.label}</span>
            <CountChip live={p.live}>
              {p.count}
              {p.live ? ` ${t("chips.now")}` : ""}
            </CountChip>
          </Link>
        ))}
      </div>
    </section>
  );
}
