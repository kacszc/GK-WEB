"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MediationView } from "@/components/dispute/MediationView";
import { disputesService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";

/** Single dispute view: loads the case by id and renders its mediation timeline. */
export function DisputeDetail({ id }: { id: string }) {
  const { t } = useI18n();
  const { data: dispute, isLoading } = useQuery({
    queryKey: ["dispute", id],
    queryFn: () => disputesService.get(id),
  });

  return (
    <div className="flex flex-col gap-4">
      <Link href="/account/disputes" className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        {t("dispute.back")}
      </Link>
      {isLoading || !dispute ? (
        <div className="grid min-h-[240px] place-items-center rounded-panel border border-line-3 bg-surface text-ink-3">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <MediationView dispute={dispute} />
      )}
    </div>
  );
}
