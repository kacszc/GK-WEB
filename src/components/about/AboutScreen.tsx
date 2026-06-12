"use client";

import { useQuery } from "@tanstack/react-query";
import { supportService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";

export function AboutScreen() {
  const { t } = useI18n();
  const { data: stats = [] } = useQuery({ queryKey: ["aboutStats"], queryFn: supportService.getAboutStats });

  return (
    <main className="flex-1">
      {/* Mission hero */}
      <div className="bg-ink px-4 py-16 text-on-dark sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-[1080px]">
          <p className="text-[12px] font-bold uppercase tracking-[1.5px] text-brand-violet">{t("about.eyebrow")}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-[-0.5px] sm:text-5xl">
            {t("about.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-on-dark/75">{t("about.subtitle")}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-auto w-full max-w-[1080px] px-4 py-12 sm:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-panel border border-line-3 bg-surface p-5">
              <p className="text-3xl font-bold text-brand-violet">{s.value}</p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.5px] text-ink-4">{s.label}</p>
              <p className="mt-1 text-[13px] text-ink-2">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
