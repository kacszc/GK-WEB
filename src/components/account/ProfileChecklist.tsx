"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, ChevronRight } from "lucide-react";
import { accountService } from "@/services";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";

/** Where each missing field gets fixed: the wizard for the required minimum, profile edit for the rest. */
const FIX_HREF: Record<string, string> = {
  name: "/onboarding/specialist?resume=1",
  specialization: "/onboarding/specialist?resume=1",
  rate: "/account/profile",
  headline: "/account/profile",
  languages: "/account/profile",
  location: "/account/profile",
  attributes: "/account/profile",
};

/**
 * "Finish your profile" card (specialist dashboard): backend-computed completeness bar +
 * a linked checklist of what's missing. Registration stays 3 fields; this is where the
 * skipped onboarding data gets collected later, at the user's own pace.
 */
export function ProfileChecklist() {
  const { user, ready } = useAuth();
  const { t, locale } = useI18n();

  // Same query key as ProfileNudge — shares the cache instead of refetching.
  const { data } = useQuery({
    queryKey: ["profileCompleteness", user?.role, locale],
    queryFn: () => accountService.getMySpecialistProfile(locale),
    enabled: ready && user?.role === "specialist",
    staleTime: 5 * 60_000,
  });

  if (!data || data.completeness >= 100 || !Array.isArray(data.missing)) return null;

  return (
    <section className="rounded-panel border border-line-3 bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-ink">{t("account.checkTitle")}</h2>
        <span className="text-[12px] font-semibold text-ink-3">{data.completeness}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-blue transition-[width] duration-500"
          style={{ width: `${data.completeness}%` }}
        />
      </div>
      <p className="mt-2 text-[12px] text-ink-3">{t("account.checkDesc")}</p>
      <ul className="mt-3 flex flex-col gap-1">
        {data.missing.map((code) => (
          <li key={code}>
            <Link
              href={FIX_HREF[code] ?? "/account/profile"}
              className="group flex items-center gap-2.5 rounded-tile px-2 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-muted"
            >
              <CircleCheck className="h-4 w-4 text-line-2 transition-colors group-hover:text-brand-violet" />
              <span className="flex-1">{t(`account.checkItem.${code}`)}</span>
              <ChevronRight className="h-4 w-4 text-ink-4" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
