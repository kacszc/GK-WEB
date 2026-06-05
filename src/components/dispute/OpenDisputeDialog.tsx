"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { disputesService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { Dispute, DisputeReason } from "@/lib/types";

const reasons: { id: DisputeReason; key: string }[] = [
  { id: "no_payment", key: "dispute.reasonNoPayment" },
  { id: "conditions", key: "dispute.reasonConditions" },
  { id: "other", key: "dispute.reasonOther" },
];
const thumbColors = ["#5b4636", "#c47b35", "#4f6b58", "#3f5b6b"];

export function OpenDisputeDialog({
  open,
  onClose,
  jobId,
  counterparty,
  onOpened,
}: {
  open: boolean;
  onClose: () => void;
  jobId: string;
  counterparty: string;
  onOpened: (d: Dispute) => void;
}) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [reason, setReason] = useState<DisputeReason>("no_payment");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const names = Array.from(e.target.files ?? []).map((f) => f.name);
    setEvidence((prev) => [...prev, ...names].slice(0, 4));
    e.target.value = "";
  }

  async function submit() {
    setSubmitting(true);
    try {
      const d = await disputesService.open({ jobId, counterparty, reason, description, evidence });
      onOpened(d);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("dispute.openTitle", { name: counterparty })}>
      <p className="-mt-2 mb-4 text-[13px] leading-relaxed text-ink-3">{t("dispute.openDesc")}</p>

      <p className="mb-2 text-[12px] font-semibold text-ink-3">{t("dispute.reasonLabel")}</p>
      <div className="flex flex-col gap-2">
        {reasons.map((r) => (
          <button
            key={r.id}
            onClick={() => setReason(r.id)}
            className={cn(
              "flex items-center gap-2.5 rounded-tile border px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors",
              reason === r.id ? "border-danger bg-danger/5 text-ink" : "border-line-2 text-ink hover:bg-muted",
            )}
          >
            <span className={cn("grid h-4 w-4 place-items-center rounded-full border-2", reason === r.id ? "border-danger" : "border-line-4")}>
              {reason === r.id && <span className="h-2 w-2 rounded-full bg-danger" />}
            </span>
            {t(r.key)}
          </button>
        ))}
      </div>

      <label className="mb-1.5 mt-4 block text-[12px] font-semibold text-ink-3">{t("dispute.descLabel")}</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder={t("dispute.descPlaceholder")}
        className="w-full resize-y rounded-tile border border-line-2 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink"
      />

      <p className="mb-2 mt-4 text-[12px] font-semibold text-ink-3">{t("dispute.evidenceLabel")}</p>
      <div className="flex flex-wrap gap-2">
        {evidence.map((name, i) => (
          <div key={`${name}-${i}`} className="relative h-16 w-16 overflow-hidden rounded-tile" style={{ background: thumbColors[i % thumbColors.length] }}>
            <button
              onClick={() => setEvidence((prev) => prev.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/55 text-on-dark"
              aria-label="remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {evidence.length < 4 && (
          <button
            onClick={() => fileRef.current?.click()}
            className="grid h-16 w-16 place-items-center rounded-tile border-2 border-dashed border-line-2 text-ink-4 hover:bg-muted"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={pick} className="hidden" />

      <div className="mt-4 flex items-start gap-2 rounded-tile bg-[#fdf6e3] px-3.5 py-3 text-[12px] text-[#8a6400]">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        {t("dispute.warn")}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} className="rounded-tile px-5 py-2.5 text-sm">
          {t("dispute.cancel")}
        </Button>
        <Button
          variant="dark"
          onClick={submit}
          disabled={submitting}
          className="rounded-tile bg-danger px-5 py-2.5 text-sm hover:bg-danger/90"
        >
          {submitting ? t("dispute.submitting") : t("dispute.submit")}
        </Button>
      </div>
    </Dialog>
  );
}
