"use client";

import { Plus, Search } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Role-aware primary CTA. The marketplace is two-sided:
 * - employer adds a job offer (/post-job) and searches specialists (/search)
 * - specialist's offer is their profile; they search job offers (/jobs)
 * So an employer (or signed-out visitor) sees "Post a job"; a specialist sees "Find work".
 */
export function HeaderCta() {
  const { user } = useAuth();
  const { t } = useI18n();
  const specialist = user?.role === "specialist";

  return (
    <Pill
      as="a"
      href={specialist ? "/jobs" : "/post-job"}
      className="border border-line-2 bg-pill text-ink hover:bg-line-2"
    >
      {specialist ? <Search className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {t(specialist ? "nav.findWork" : "nav.addJob")}
    </Pill>
  );
}
