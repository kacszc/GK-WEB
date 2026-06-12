"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Guards employer-only account sections (tokens wallet, revealed contacts, token history).
 * Renders inside AccountShell, which already handles the signed-out case — here we only block
 * specialists, who have no token economy (contacts/boost are paid by employers).
 */
export function EmployerOnly({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const { t } = useI18n();

  if (ready && user && user.role !== "employer") {
    return (
      <div className="grid min-h-[40vh] place-items-center px-4 text-center">
        <div>
          <p className="text-sm font-semibold text-ink">{t("account.employerOnly")}</p>
          <Link
            href="/account"
            className="mt-4 inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-on-dark hover:bg-ink/90"
          >
            {t("account.backToAccount")}
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
