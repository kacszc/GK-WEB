"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { kycService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

/** Identity verification (KYC) — submit a document; approval marks the profile verified + raises Trust. */
export function KycCard() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: status = "NONE" } = useQuery({ queryKey: ["kyc"], queryFn: kycService.status });
  const submit = useMutation({
    mutationFn: () => kycService.submit("ID_CARD"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc"] }),
  });

  const approved = status === "APPROVED";
  const pending = status === "PENDING";

  return (
    <section className="rounded-panel border border-line-3 bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
            <ShieldCheck className={cn("h-4 w-4", approved ? "text-success" : "text-ink-3")} />
            {t("account.kycTitle")}
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">{t("account.kycDesc")}</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
            approved ? "bg-success-badge text-on-dark" : pending ? "bg-[#fdf6e3] text-[#8a6400]" : "bg-pill text-ink-3",
          )}
        >
          {approved && <ShieldCheck className="h-3 w-3" />}
          {pending && <Clock className="h-3 w-3" />}
          {approved ? t("account.kycApproved") : pending ? t("account.kycPending") : t("account.kycNone")}
        </span>
      </div>
      {!approved && (
        <Button
          variant="dark"
          onClick={() => submit.mutate()}
          disabled={submit.isPending}
          className="mt-4 rounded-tile px-4 py-2.5 text-[13px]"
        >
          {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.kycVerify")}
        </Button>
      )}
    </section>
  );
}
