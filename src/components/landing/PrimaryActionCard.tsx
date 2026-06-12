"use client";

import { Plus, Search } from "lucide-react";
import { ActionCard } from "./ActionCard";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Role-aware third action card. Employers (and signed-out visitors) get "Post a job"; specialists,
 * whose side is finding work, get "Find work" → the job board. Mirrors the header CTA.
 */
export function PrimaryActionCard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const specialist = user?.role === "specialist";

  if (specialist) {
    return (
      <ActionCard
        theme="dark"
        href="/jobs"
        icon={<Search className="h-7 w-7 text-on-dark" />}
        title={t("actions.findWorkTitle")}
        desc={t("actions.findWorkDesc")}
        cta={t("actions.findWorkCta")}
      />
    );
  }
  return (
    <ActionCard
      theme="dark"
      href="/post-job"
      icon={<Plus className="h-7 w-7 text-on-dark" />}
      title={t("actions.jobTitle")}
      desc={t("actions.jobDesc")}
      cta={t("actions.jobCta")}
    />
  );
}
