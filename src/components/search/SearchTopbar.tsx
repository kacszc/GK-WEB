"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { HeaderAuth } from "@/components/layout/HeaderAuth";
import { useI18n } from "@/i18n/I18nProvider";

export function SearchTopbar({ category }: { category: string }) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>
          {/* Breadcrumb */}
          <nav className="hidden min-w-0 items-center gap-1.5 text-[13px] text-ink-3 md:flex">
            <Link href="/" className="hover:text-ink">
              {t("results.breadcrumbHome")}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-ink-4" />
            <Link href="/search" className="hover:text-ink">
              {t("results.breadcrumbSpecialists")}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-ink-4" />
            <span className="truncate font-medium text-ink">{category}</span>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          {/* Real auth-wired controls: when signed in → tokens + notifications + account menu;
              when signed out → log in / sign up. */}
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
