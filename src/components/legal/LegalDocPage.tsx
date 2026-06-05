"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Printer, History } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { legalService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

export function LegalDocPage({ slug }: { slug: string }) {
  const { t } = useI18n();
  const { data: doc, isLoading } = useQuery({
    queryKey: ["legal", slug],
    queryFn: () => legalService.getDocument(slug),
  });

  const [active, setActive] = useState<string>("");

  // Scrollspy: highlight the section currently nearest the top.
  useEffect(() => {
    if (!doc) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    doc.sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [doc]);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 py-12 sm:px-8">
        <div className="skeleton h-10 w-2/3 rounded-tile" />
        <div className="mt-4 skeleton h-4 w-1/3 rounded-tile" />
        <div className="mt-10 skeleton h-96 rounded-panel" />
      </main>
    );
  }
  if (!doc) {
    return (
      <main className="mx-auto grid w-full max-w-[1080px] flex-1 place-items-center px-4 py-24">
        <p className="text-sm text-ink-3">404</p>
      </main>
    );
  }

  return (
    <main className="flex-1">
      {/* Header band */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto w-full max-w-[1080px] px-4 py-12 sm:px-8">
          <p className="text-[12px] font-bold uppercase tracking-[1px] text-brand-violet">{t("legal.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.5px] text-ink sm:text-4xl">{doc.title}</h1>
          <p className="mt-3 text-[13px] text-ink-3">
            {t("legal.effectiveFrom", { date: doc.effectiveFrom })} · {t("legal.versionLabel", { v: doc.version })} ·{" "}
            {t("legal.updatedLabel", { date: doc.updated })}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="dark" onClick={() => window.print()} className="rounded-tile px-4 py-2 text-[13px]">
              <Download className="h-4 w-4" />
              {t("legal.downloadPdf")}
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="rounded-tile px-4 py-2 text-[13px]">
              <Printer className="h-4 w-4" />
              {t("legal.print")}
            </Button>
            <Button variant="outline" className="rounded-tile px-4 py-2 text-[13px]">
              <History className="h-4 w-4" />
              {t("legal.versionHistory", { n: 3 })}
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto grid w-full max-w-[1080px] gap-10 px-4 py-12 sm:px-8 lg:grid-cols-[240px_1fr]">
        {/* TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[1px] text-ink-4">{t("legal.toc")}</p>
            <nav className="flex flex-col gap-0.5 border-l border-line">
              {doc.sections.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={cn(
                    "-ml-px border-l-2 py-1.5 pl-3 text-[13px] transition-colors",
                    active === s.id
                      ? "border-brand-violet font-semibold text-ink"
                      : "border-transparent text-ink-3 hover:text-ink",
                  )}
                >
                  {i + 1}. {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Sections */}
        <div className="flex flex-col gap-8">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-lg font-bold text-ink">
                <span className="text-brand-violet">{s.number}</span>&nbsp;&nbsp;{s.title}
              </h2>
              <div className="mt-3 flex flex-col gap-2.5">
                {s.paragraphs.map((p, i) => (
                  <p key={i} className="text-[14px] leading-relaxed text-ink-2">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
