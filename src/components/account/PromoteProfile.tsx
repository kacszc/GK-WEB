"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Rocket, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { accountService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/lib/ToastProvider";
import { cn } from "@/lib/cn";

const DAY_OPTIONS = [7, 14, 30];

/**
 * Specialist self-promotion ("boost your offer"). Mirrors the employer's job boost, but payment is
 * not wired yet — confirming just grants the boost (the profile sorts first in search).
 */
export function PromoteProfile() {
  const { t } = useI18n();
  const { show } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(7);

  const boost = useMutation({
    mutationFn: () => accountService.boostMyProfile(days),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mySpecialistProfile"] });
      show({ title: t("account.promoteDone") });
      setOpen(false);
    },
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-panel border border-brand-violet/30 bg-[#f6f3ff] p-5 text-left text-ink transition-colors hover:bg-[#efe9ff]"
      >
        <span className="grid h-10 w-10 place-items-center rounded-tile bg-white text-brand-violet">
          <Rocket className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-[15px] font-semibold">{t("account.promote")}</span>
          <span className="block text-[12px] text-ink-3">{t("account.promoteSubtitle")}</span>
        </span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={t("account.promoteTitle")}>
        <p className="text-sm text-ink-2">{t("account.promoteDesc")}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "rounded-tile border px-3 py-3 text-center transition-colors",
                days === d ? "border-ink bg-ink text-on-dark" : "border-line-2 text-ink hover:bg-muted",
              )}
            >
              <div className="text-lg font-bold">{d}</div>
              <div className="text-[11px] opacity-80">{t("account.boostDaysUnit")}</div>
            </button>
          ))}
        </div>
        <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-success">
          <Check className="h-3.5 w-3.5" />
          {t("account.promoteFree")}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-tile px-4 py-2.5 text-sm">
            {t("account.boostCancel")}
          </Button>
          <Button variant="dark" onClick={() => boost.mutate()} disabled={boost.isPending} className="rounded-tile px-4 py-2.5 text-sm">
            {boost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.promoteConfirm")}
          </Button>
        </div>
        {boost.isError && <p className="mt-3 text-center text-[13px] text-danger">{t("account.boostError")}</p>}
      </Dialog>
    </>
  );
}
