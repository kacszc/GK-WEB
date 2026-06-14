"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { reviewsService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/lib/ToastProvider";
import { requestErrorToast } from "@/lib/errorToast";
import { cn } from "@/lib/cn";

/** Whether the reviewed party is the worker (employer rates them) or the employer (worker rates them). */
export type ReviewSubjectKind = "worker" | "employer";

const FLAGS: Record<ReviewSubjectKind, { code: string; key: string }[]> = {
  worker: [
    { code: "NO_SHOW", key: "reviewFlags.noShow" },
    { code: "WORK_NOT_AS_DESCRIBED", key: "reviewFlags.workNotAsDescribed" },
  ],
  employer: [
    { code: "LATE_PAYMENT", key: "reviewFlags.latePayment" },
    { code: "CONDITIONS_DIFFERENT", key: "reviewFlags.conditionsDifferent" },
  ],
};

/**
 * Two-sided review form for a completed job. The category set + flags follow the direction:
 * rating a worker → punctuality / quality / communication; rating an employer → payment / conditions
 * / communication. The overall stars are required; categories and flags are optional.
 */
export function ReviewDialog({
  open,
  jobId,
  subjectId,
  subjectKind,
  onClose,
  onDone,
}: {
  open: boolean;
  jobId: string;
  subjectId: string;
  subjectKind: ReviewSubjectKind;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [c1, setC1] = useState(0); // punctuality | payment
  const [c2, setC2] = useState(0); // quality | conditions
  const [communication, setCommunication] = useState(0);
  const [flags, setFlags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const isWorker = subjectKind === "worker";
  const toggleFlag = (f: string) =>
    setFlags((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  async function submit() {
    setSubmitting(true);
    try {
      await reviewsService.submit(jobId, subjectId, rating, text, {
        communication: communication || undefined,
        ...(isWorker
          ? { punctuality: c1 || undefined, quality: c2 || undefined }
          : { payment: c1 || undefined, conditions: c2 || undefined }),
        flags: flags.length ? flags : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["reviews", subjectId] });
      setDone(true);
    } catch (e) {
      show(requestErrorToast(e, t));
    } finally {
      setSubmitting(false);
    }
  }

  const title = isWorker ? t("jobDetail.reviewTitle") : t("jobDetail.reviewTitleEmployer");

  return (
    <Dialog open={open} onClose={onClose} title={done ? undefined : title}>
      {done ? (
        <div className="py-2 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-chip text-success-chip-text">
            <Check className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-lg font-bold text-ink">{t("jobDetail.reviewSuccessTitle")}</h2>
          <p className="mt-1 text-sm text-ink-2">{t("jobDetail.reviewSuccessDesc")}</p>
          <Button variant="dark" onClick={onDone} className="mt-5 w-full rounded-tile py-3 text-sm">
            {t("contact.done")}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-center gap-1.5 py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n}`}>
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    n <= rating ? "fill-current text-[#e0a400]" : "text-line-4",
                  )}
                />
              </button>
            ))}
          </div>

          {/* Per-category ratings (optional) — labels depend on the direction. */}
          <div className="mt-2 flex flex-col gap-2 rounded-tile bg-subtle p-3">
            <CatRow label={t(isWorker ? "reviewCats.punctuality" : "reviewCats.payment")} value={c1} onChange={setC1} />
            <CatRow label={t(isWorker ? "reviewCats.quality" : "reviewCats.conditions")} value={c2} onChange={setC2} />
            <CatRow label={t("reviewCats.communication")} value={communication} onChange={setCommunication} />
          </div>

          {/* Incident flags (optional). */}
          <p className="mb-1.5 mt-3 text-[12px] font-semibold text-ink-3">{t("jobDetail.reviewFlags")}</p>
          <div className="flex flex-wrap gap-2">
            {FLAGS[subjectKind].map((f) => (
              <button
                key={f.code}
                type="button"
                onClick={() => toggleFlag(f.code)}
                className={cn(
                  "rounded-tile border px-3 py-1.5 text-[12px] transition-colors",
                  flags.includes(f.code)
                    ? "border-[#c0322b] bg-[#fdecec] text-[#c0322b]"
                    : "border-line-2 text-ink-2 hover:bg-muted",
                )}
              >
                {t(f.key)}
              </button>
            ))}
          </div>

          <label className="mb-1.5 mt-3 block text-[12px] font-semibold text-ink-3">{t("jobDetail.reviewComment")}</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={t("jobDetail.reviewPlaceholder")}
            className="w-full resize-y rounded-tile border border-line-2 bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-ink placeholder:text-ink-4"
          />
          <Button variant="gradient" onClick={submit} disabled={submitting} className="mt-3 w-full rounded-tile py-3 text-sm">
            {submitting ? t("jobDetail.reviewSubmitting") : t("jobDetail.reviewSubmit")}
          </Button>
        </>
      )}
    </Dialog>
  );
}

/** A compact 1–5 star picker for a single review category. */
function CatRow({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-ink-2">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${label} ${n}`}>
            <Star className={cn("h-4 w-4", n <= value ? "fill-current text-[#e0a400]" : "text-line-4")} />
          </button>
        ))}
      </div>
    </div>
  );
}
