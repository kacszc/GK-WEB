"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Users, Rocket, Loader2, Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { accountService, walletService } from "@/services";
import { useWallet } from "@/lib/WalletProvider";
import { useToast } from "@/lib/ToastProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { MyJob, MyJobStatus } from "@/lib/types";

const BOOST_PER_DAY = 5;
const DAY_OPTIONS = [3, 7, 14];

const statusStyle: Record<MyJobStatus, string> = {
  draft: "bg-pill text-ink-2",
  active: "bg-success-chip text-success-chip-text",
  unpublished: "bg-pill text-ink-3",
  filled: "bg-[#e7efff] text-[#1158ed]",
  completed: "bg-pill text-ink-2",
  expired: "bg-pill text-ink-3",
};
const statusKey: Record<MyJobStatus, string> = {
  draft: "account.statusDraft",
  active: "account.statusActive",
  unpublished: "account.statusUnpublished",
  filled: "account.statusFilled",
  completed: "account.statusCompleted",
  expired: "account.statusExpired",
};

export function MyJobsList() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { setBalance } = useWallet();
  const { show } = useToast();
  const [boostJob, setBoostJob] = useState<MyJob | null>(null);
  const [days, setDays] = useState(7);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["myJobs"],
    queryFn: accountService.getMyJobs,
  });

  const boost = useMutation({
    mutationFn: () => walletService.boost(boostJob!.id, days),
    onSuccess: (r) => {
      setBalance(r.balance);
      qc.invalidateQueries({ queryKey: ["myJobs"] });
      show({ title: t("account.boostDone", { title: boostJob!.title }) });
      setBoostJob(null);
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("account.jobsTitle")}</h1>
        <Link
          href="/post-job"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-tile bg-ink px-4 py-2.5 text-[13px] font-bold text-on-dark transition-colors hover:bg-ink/90"
        >
          <Plus className="h-4 w-4" />
          {t("account.addJob")}
        </Link>
      </div>

      {isLoading ? (
        <Skeletons />
      ) : jobs.length === 0 ? (
        <Empty>
          <p className="text-sm font-semibold text-ink">{t("account.jobsEmpty")}</p>
          <Link
            href="/post-job"
            className="mt-3 inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-bold text-on-dark"
          >
            {t("account.postFirst")}
          </Link>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="flex flex-col gap-3 rounded-panel border border-line-3 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold text-ink">{j.title}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", statusStyle[j.status])}>
                    {t(statusKey[j.status])}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-2">
                  <span>{j.profession}</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-ink-4" />
                    {j.district}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-ink-4" />
                    {t("account.applicants", { n: j.applicants })}
                  </span>
                  <span className="text-ink-4">· {j.postedAgo}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {j.status === "active" && (
                  <button
                    onClick={() => {
                      setDays(7);
                      setBoostJob(j);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-tile border border-line-2 bg-surface px-3 py-2 text-[13px] font-medium text-brand-violet hover:bg-muted"
                  >
                    <Rocket className="h-3.5 w-3.5" />
                    {t("account.boost")}
                  </button>
                )}
                <Link
                  href={`/account/jobs/${j.id}`}
                  className="inline-flex items-center justify-center rounded-tile border border-line-2 bg-surface px-4 py-2 text-[13px] font-medium text-ink hover:bg-muted"
                >
                  {t("account.viewApplicants")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!boostJob} onClose={() => setBoostJob(null)} title={t("account.boostTitle")}>
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
          <Button variant="outline" onClick={() => setBoostJob(null)} className="rounded-tile px-4 py-2.5 text-sm">
            {t("portfolio.cancel")}
          </Button>
          <Button variant="dark" onClick={() => boost.mutate()} disabled={boost.isPending} className="rounded-tile px-4 py-2.5 text-sm">
            {boost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.boostConfirm", { n: days * BOOST_PER_DAY })}
          </Button>
        </div>
        {boost.isError && <p className="mt-3 text-center text-[13px] text-danger">{t("account.boostError")}</p>}
      </Dialog>
    </div>
  );
}

function Skeletons() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton h-20 rounded-panel" />
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[200px] place-items-center rounded-panel border border-dashed border-line-2 text-center">
      <div>{children}</div>
    </div>
  );
}
