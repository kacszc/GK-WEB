"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AccountSidebar } from "./AccountSidebar";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const { t } = useI18n();

  if (!ready) {
    return (
      <main className="mx-auto grid min-h-[50vh] w-full max-w-[1280px] place-items-center px-4">
        <Loader2 className="h-6 w-6 animate-spin text-brand-violet" />
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
      <div>{children}</div>
    </main>
  );
}
