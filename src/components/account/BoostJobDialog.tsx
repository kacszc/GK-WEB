"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { walletService } from "@/services";
import { useWallet } from "@/lib/WalletProvider";
import { useToast } from "@/lib/ToastProvider";
import { requestErrorToast } from "@/lib/errorToast";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

const BOOST_PER_DAY = 5;
const DAY_OPTIONS = [3, 7, 14];

/** Shared "boost this job" dialog (spends tokens to promote a job for N days). */
export function BoostJobDialog({
  job,
  onClose,
}: {
  job: { id: string; title: string } | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { setBalance } = useWallet();
  const { show } = useToast();
  const [days, setDays] = useState(7);

  const boost = useMutation({
    mutationFn: () => walletService.boost(job!.id, days),
    onSuccess: (r) => {
      setBalance(r.balance);
      qc.invalidateQueries({ queryKey: ["myJobs"] });
      qc.invalidateQueries({ queryKey: ["job", job!.id] });
      show({ title: t("account.boostDone", { title: job!.title }) });
      onClose();
    },
    onError: (e) => show(requestErrorToast(e, t)),
  });

  return (
    <Dialog open={!!job} onClose={onClose} title={t("account.boostTitle")}>
      <p className="text-sm text-ink-2">{t("account.boostDesc", { perDay: BOOST_PER_DAY })}</p>
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
            <div className="mt-1 text-[11px]">{t("account.boostCost", { n: d * BOOST_PER_DAY })}</div>
          </button>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} className="rounded-tile px-4 py-2.5 text-sm">
          {t("portfolio.cancel")}
        </Button>
        <Button variant="dark" onClick={() => boost.mutate()} disabled={boost.isPending} className="rounded-tile px-4 py-2.5 text-sm">
          {boost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.boostConfirm", { n: days * BOOST_PER_DAY })}
        </Button>
      </div>
      {boost.isError && <p className="mt-3 text-center text-[13px] text-danger">{t("account.boostError")}</p>}
    </Dialog>
  );
}
