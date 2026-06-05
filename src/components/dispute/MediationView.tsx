"use client";

import { useState } from "react";
import { Scale, UserCheck, MessageSquare, Banknote, Check, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { disputesService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { Dispute, DisputeEventType } from "@/lib/types";

const eventIcon: Record<DisputeEventType, React.ComponentType<{ className?: string }>> = {
  opened: Scale,
  mediator: UserCheck,
  response: MessageSquare,
  system: Banknote,
  closed: Check,
};
const eventColor: Record<DisputeEventType, string> = {
  opened: "bg-danger text-on-dark",
  mediator: "bg-brand-violet text-on-dark",
  response: "bg-[#2563eb] text-on-dark",
  system: "bg-success text-on-dark",
  closed: "bg-success text-on-dark",
};

export function MediationView({ dispute }: { dispute: Dispute }) {
  const { t } = useI18n();
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);

  async function resolve() {
    setResolving(true);
    try {
      await disputesService.resolve(dispute.id);
      setResolved(true);
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="rounded-panel border border-line-3 bg-surface p-5">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-tile bg-[#fdf6e3] px-3.5 py-2.5">
        <span className="text-[12px] font-semibold text-[#8a6400]">
          {t("dispute.mediationActive", { mediator: dispute.mediator })}
        </span>
        <span className="text-[12px] font-medium text-[#8a6400]">{t("dispute.remaining", { t: dispute.remaining })}</span>
      </div>

      <h2 className="mt-4 text-lg font-bold text-ink">
        {`Spór #${dispute.id} · ${dispute.counterparty}`}
      </h2>
      <p className="mt-0.5 text-[12px] text-ink-3">
        {t("dispute.reasonOpened", { reason: dispute.reasonLabel, date: dispute.openedAt })}
      </p>

      {/* Timeline */}
      <ul className="mt-4 flex flex-col gap-4">
        {dispute.events.map((ev) => {
          const Icon = eventIcon[ev.type];
          return (
            <li key={ev.id} className="flex gap-3">
              <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full", eventColor[ev.type])}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-ink">{ev.title}</p>
                  <span className="text-[11px] text-ink-4">{ev.time}</span>
                </div>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{ev.text}</p>
              </div>
            </li>
          );
        })}
        {resolved && (
          <li className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-success text-on-dark">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-success-chip-text">{t("dispute.resolvedTitle")}</p>
              <p className="mt-0.5 text-[13px] text-ink-2">{t("dispute.resolvedDesc")}</p>
            </div>
          </li>
        )}
      </ul>

      {!resolved && (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="rounded-tile px-4 py-2.5 text-[13px] text-danger">
            {t("dispute.escalate")}
          </Button>
          <Button variant="dark" onClick={resolve} disabled={resolving} className="rounded-tile bg-success px-4 py-2.5 text-[13px] hover:bg-success/90">
            {resolving ? <><Loader2 className="h-4 w-4 animate-spin" />{t("dispute.resolving")}</> : <><Check className="h-4 w-4" />{t("dispute.resolve")}</>}
          </Button>
        </div>
      )}
    </div>
  );
}
