"use client";

import { ChevronRight, Coins } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";
import { useWallet } from "@/lib/WalletProvider";

export function SearchTopbar({ category }: { category: string }) {
  const { t } = useI18n();
  const { balance } = useWallet();

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
          <Link
            href="/account/tokens"
            className="inline-flex items-center gap-1.5 rounded-full bg-pill px-3 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:bg-line-2"
          >
            <Coins className="h-3.5 w-3.5 text-[#e0a400]" />
            {t("results.tokens", { n: balance })}
          </Link>
          <LanguageSwitcher />
          <span className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-violet to-brand-blue" aria-hidden />
        </div>
      </div>
    </header>
  );
}
