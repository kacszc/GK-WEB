"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, LifeBuoy, ArrowRight } from "lucide-react";
import { supportService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";

export function HelpScreen() {
  const { t, dict } = useI18n();
  const [q, setQ] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["helpCategories"],
    queryFn: supportService.getHelpCategories,
  });
  const { data: articles = [] } = useQuery({
    queryKey: ["helpArticles"],
    queryFn: supportService.getPopularArticles,
  });

  const filtered = q.trim()
    ? articles.filter((a) => (a.question + a.answer).toLowerCase().includes(q.toLowerCase()))
    : articles;

  return (
    <main className="flex-1">
      {/* Hero */}
      <div className="bg-gradient-to-r from-brand-violet to-brand-blue px-4 py-16 text-center text-on-dark sm:px-8 sm:py-20">
        <p className="text-[12px] font-bold uppercase tracking-[1.5px] text-on-dark/80">{t("help.eyebrow")}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.5px] sm:text-5xl">{t("help.title")}</h1>
        <div className="mx-auto mt-7 flex w-full max-w-[600px] items-center gap-3 rounded-full bg-surface px-5 py-3.5 shadow-search">
          <Search className="h-5 w-5 shrink-0 text-ink-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("help.searchPlaceholder")}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[13px]">
          <span className="text-on-dark/70">{t("help.popularLabel")}</span>
          {dict.help.popularChips.map((c) => (
            <button
              key={c}
              onClick={() => setQ(c)}
              className="rounded-full bg-on-dark/15 px-3 py-1 font-medium text-on-dark transition-colors hover:bg-on-dark/25"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mx-auto w-full max-w-[1080px] px-4 py-12 sm:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              href="/contact"
              className="rounded-panel border border-line-3 bg-surface p-5 transition-shadow hover:shadow-sm"
            >
              <span className="grid h-11 w-11 place-items-center rounded-tile" style={{ background: c.color }}>
                <LifeBuoy className="h-5 w-5 text-on-dark" />
              </span>
              <p className="mt-4 text-[15px] font-semibold text-ink">{c.name}</p>
              <p className="mt-0.5 text-[12px] text-ink-4">{t("help.articleCount", { n: c.articleCount })}</p>
            </Link>
          ))}
        </div>

        {/* Popular articles */}
        <p className="mb-4 mt-12 text-[11px] font-bold uppercase tracking-[1px] text-ink-4">{t("help.articlesLabel")}</p>
        <div className="flex flex-col gap-3">
          {filtered.map((a) => (
            <details key={a.id} className="group rounded-panel border border-line-3 bg-surface p-4">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <span className="text-[15px] font-semibold text-ink">{a.question}</span>
                <span className="shrink-0 text-[11px] text-ink-4">{t("help.views", { n: a.views.toLocaleString("pl-PL") })}</span>
              </summary>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{a.answer}</p>
            </details>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-panel bg-ink p-6 text-on-dark sm:flex-row sm:items-center">
          <div>
            <p className="text-[15px] font-bold">{t("help.ctaTitle")}</p>
            <p className="mt-0.5 text-[13px] text-on-dark/70">{t("help.ctaDesc")}</p>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center gap-2 rounded-tile bg-surface px-5 py-2.5 text-sm font-bold text-ink hover:bg-surface/90"
          >
            {t("help.ctaButton")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
