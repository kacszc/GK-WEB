"use client";

import Link from "next/link";
import { RotateCw, Home } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useI18n } from "@/i18n/I18nProvider";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <header className="px-4 py-4 sm:px-8">
        <Link href="/">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-20 text-center">
        <p className="bg-gradient-to-r from-[#ff8a3d] to-[#ff5470] bg-clip-text text-7xl font-bold tracking-tight text-transparent">
          500
        </p>
        <p className="mt-3 text-[12px] font-bold uppercase tracking-[1px] text-ink-4">{t("errorPage.code")}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.5px] text-ink">{t("errorPage.title")}</h1>
        <p className="mt-2 max-w-md text-sm text-ink-2">{t("errorPage.desc")}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-on-dark hover:bg-ink/90"
          >
            <RotateCw className="h-4 w-4" />
            {t("errorPage.retry")}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-surface px-5 py-2.5 text-sm font-medium text-ink hover:bg-muted"
          >
            <Home className="h-4 w-4" />
            {t("errorPage.home")}
          </Link>
        </div>
      </main>
    </div>
  );
}
