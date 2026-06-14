"use client";

import Link from "next/link";
import { AccountSidebar } from "./AccountSidebar";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const { t } = useI18n();

  // While the session is being restored, mirror the real layout with a sidebar
  // + content skeleton instead of a bare spinner, so there's no layout shift.
  if (!ready) {
    return (
      <main className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 pt-6 pb-20 sm:px-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5" aria-hidden>
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 shrink-0 rounded-tile lg:w-full" />
          ))}
        </nav>
        <div className="flex min-w-0 flex-col gap-6">
          <Skeleton className="h-8 w-56 rounded-tile" />
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} className="h-[104px] border border-line-3" />
            ))}
          </div>
          <SkeletonCard className="h-64 border border-line-3" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto grid min-h-[50vh] w-full max-w-[1280px] place-items-center px-4 text-center">
        <div>
          <p className="text-sm font-semibold text-ink">{t("account.loginRequired")}</p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-on-dark hover:bg-ink/90"
          >
            {t("auth.loginCta")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 pt-6 pb-20 sm:px-8 lg:grid-cols-[220px_1fr]">
      <AccountSidebar />
      {/* min-w-0: let the content column shrink below its content so wide rows (truncated text)
          clip instead of forcing horizontal page scroll on mobile. */}
      <div className="min-w-0">{children}</div>
    </main>
  );
}
