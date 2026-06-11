"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, MapPin, Coins, BadgeCheck, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import {
  applicationsService,
  WITHDRAW_REASONS,
  type MyApplication,
  type WithdrawReason,
} from "@/services";
import { jobRateLabel } from "@/lib/jobRate";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/lib/ToastProvider";
import { cn } from "@/lib/cn";

/** Specialist-side: the jobs I've applied to, with status + the option to withdraw (with a survey). */
export function ApplicationsScreen() {
  const { t, locale } = useI18n();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["myApplications", locale],
    queryFn: () => applicationsService.getMine(locale),
  });

  const [withdrawing, setWithdrawing] = useState<MyApplication | null>(null);

  function formatDate(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("applications.title")}</h1>
        <p className="mt-1 text-[13px] text-ink-3">{t("applications.subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="skeleton h-24 rounded-panel" />
      ) : items.length === 0 ? (
        <div className="grid min-h-[160px] place-items-center rounded-panel border border-dashed border-line-2 text-center">
          <div>
            <Send className="mx-auto h-7 w-7 text-ink-4" />
            <p className="mt-2 text-sm text-ink-3">{t("applications.empty")}</p>
            <Link href="/jobs" className="mt-3 inline-block text-[13px] font-semibold text-brand-violet hover:underline">
              {t("applications.browse")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-panel border border-line-3 bg-surface p-4">
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-ink">{a.title}</h3>
                {a.employer && (
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-ink-2">
                    {a.employer}
                    {a.employerVerified && <BadgeCheck className="h-3.5 w-3.5 text-[#1158ed]" />}
                  </p>
                )}
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-2">
                  <span className="rounded-tile bg-pill px-2 py-0.5 font-medium">{a.profession}</span>
                  {a.district && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-ink-4" />
                      {a.district}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 font-semibold text-ink">
                    <Coins className="h-3.5 w-3.5 text-[#e0a400]" />
                    {jobRateLabel({ rate: a.rateFrom, rateDisclosed: a.rateDisclosed, currency: a.currency }, t)}
                  </span>
                </p>
                {a.status === "WITHDRAWN" && (
                  <p className="mt-2 text-[12px] text-ink-3">
                    {t("applications.withdrawnAt", { date: formatDate(a.withdrawnAt) })}
                    {a.withdrawReason && (
                      <> · {t("applications.withdrawReasonLabel", { reason: t(`applications.reason.${a.withdrawReason}`) })}</>
                    )}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <StatusBadge status={a.status} t={t} />
                {a.status === "APPLIED" && (
                  <button
                    onClick={() => setWithdrawing(a)}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-3 hover:text-danger"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {t("applications.withdraw")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <WithdrawDialog application={withdrawing} onClose={() => setWithdrawing(null)} />
    </div>
  );
}

function StatusBadge({ status, t }: { status: MyApplication["status"]; t: (k: string) => string }) {
  const map: Record<string, { key: string; cls: string }> = {
    APPLIED: { key: "applications.statusApplied", cls: "bg-[#fdf0cf] text-[#8a6400]" },
    SELECTED: { key: "applications.statusSelected", cls: "bg-success-chip text-success-chip-text" },
    REJECTED: { key: "applications.statusRejected", cls: "bg-pill text-ink-3" },
    WITHDRAWN: { key: "applications.statusWithdrawn", cls: "bg-pill text-ink-3" },
  };
  const s = map[status] ?? map.APPLIED;
  return (
    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold", s.cls)}>{t(s.key)}</span>
  );
}

/** Survey dialog: a required reason + optional comment, persisted on the application. */
function WithdrawDialog({ application, onClose }: { application: MyApplication | null; onClose: () => void }) {
  const { t } = useI18n();
  const { show } = useToast();
  const qc = useQueryClient();
  const [reason, setReason] = useState<WithdrawReason | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  // Reset the form whenever a different application is targeted.
  const [lastId, setLastId] = useState<string | null>(null);
  if (application && application.id !== lastId) {
    setLastId(application.id);
    setReason(null);
    setComment("");
  }

  async function submit() {
    if (!application || !reason) return;
    setBusy(true);
    try {
      await applicationsService.withdraw(application.id, reason, comment);
      await qc.invalidateQueries({ queryKey: ["myApplications"] });
      show({ title: t("applications.withdrawSuccess") });
      onClose();
    } catch {
      show({ title: t("error.title"), body: t("error.body") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!application} onClose={onClose} title={t("applications.withdrawTitle")}>
      <p className="text-sm text-ink-2">{t("applications.withdrawSubtitle")}</p>
      <div className="mt-4 flex flex-col gap-2">
        {WITHDRAW_REASONS.map((code) => (
          <button
            key={code}
            onClick={() => setReason(code)}
            className={cn(
              "rounded-tile border px-3 py-2.5 text-left text-sm transition-colors",
              reason === code ? "border-ink bg-ink text-on-dark" : "border-line-2 text-ink hover:bg-muted",
            )}
          >
            {t(`applications.reason.${code}`)}
          </button>
        ))}
      </div>
      <label className="mb-1.5 mt-4 block text-[12px] font-semibold text-ink-3">
        {t("applications.withdrawCommentLabel")}
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder={t("applications.withdrawCommentPlaceholder")}
        className="w-full resize-y rounded-tile border border-line-2 bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-ink placeholder:text-ink-4"
      />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} className="rounded-tile px-4 py-2.5 text-sm">
          {t("applications.withdrawCancel")}
        </Button>
        <Button
          variant="dark"
          onClick={submit}
          disabled={busy || !reason}
          className="rounded-tile px-4 py-2.5 text-sm disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("applications.withdrawConfirm")}
        </Button>
      </div>
    </Dialog>
  );
}
