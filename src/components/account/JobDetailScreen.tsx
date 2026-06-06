"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Star, Check, Loader2, CheckCircle2 } from "lucide-react";
import { accountService, reviewsService } from "@/services";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { OpenDisputeDialog } from "@/components/dispute/OpenDisputeDialog";
import { MediationView } from "@/components/dispute/MediationView";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { Applicant, Dispute } from "@/lib/types";

type Phase = "applicants" | "inProgress" | "completed";

export function JobDetailScreen({ id }: { id: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: job } = useQuery({ queryKey: ["job", id], queryFn: () => accountService.getJob(id) });
  const { data: applicants = [], isLoading } = useQuery({
    queryKey: ["applicants", id],
    queryFn: () => accountService.getApplicants(id),
  });

  const [phase, setPhase] = useState<Phase>("applicants");
  const [worker, setWorker] = useState<Applicant | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [dispute, setDispute] = useState<Dispute | null>(null);

  async function select(a: Applicant) {
    setSelecting(a.id);
    try {
      if (a.applicationId) {
        await accountService.selectApplicant(id, a.applicationId);
        await queryClient.invalidateQueries({ queryKey: ["applicants", id] });
      }
      setWorker(a);
      setPhase("inProgress");
    } finally {
      setSelecting(null);
    }
  }

  async function confirm() {
    setConfirming(true);
    try {
      await accountService.confirmCompletion(id);
      setPhase("completed");
    } finally {
      setConfirming(false);
    }
  }

  const statusBadge =
    phase === "inProgress"
      ? { text: t("jobDetail.statusInProgress"), cls: "bg-[#fdf0cf] text-[#8a6400]" }
      : phase === "completed"
        ? { text: t("jobDetail.statusCompleted"), cls: "bg-success-chip text-success-chip-text" }
        : null;

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/account/jobs"
        className="inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-ink-2 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("jobDetail.back")}
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{job?.title ?? "—"}</h1>
        {statusBadge && (
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", statusBadge.cls)}>
            {statusBadge.text}
          </span>
        )}
      </div>
      {job && (
        <p className="-mt-3 text-[13px] text-ink-3">
          {job.profession} · {job.district} · {job.rate} zł/h
        </p>
      )}

      {/* Phase: applicants */}
      {phase === "applicants" && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-ink">
            {t("jobDetail.applicants", { n: applicants.length })}
          </h2>
          {isLoading ? (
            <div className="skeleton h-40 rounded-panel" />
          ) : applicants.length === 0 ? (
            <p className="text-sm text-ink-3">{t("jobDetail.noApplicants")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {applicants.map((a) => (
                <div key={a.id} className="rounded-panel border border-line-3 bg-surface p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={a.name} index={a.avatarIndex} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/specialist/${a.id}`} className="text-sm font-semibold text-ink hover:underline">
                          {a.name}
                        </Link>
                        {a.trustScore > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-success-badge px-1.5 py-0.5 text-[10px] font-bold text-on-dark">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            {a.trustScore}
                          </span>
                        )}
                        <span className="text-[11px] text-ink-4">{a.appliedAgo}</span>
                      </div>
                      {a.role && (
                        <p className="text-[12px] text-ink-3">
                          {a.role} · <MapPin className="inline h-3 w-3" /> {a.district} · ★ {a.rating.toFixed(1)} ({a.reviews}) · {a.rate} zł/h
                        </p>
                      )}
                      <p className="mt-2 text-[13px] text-ink-2">{a.message}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="dark"
                      onClick={() => select(a)}
                      disabled={selecting !== null}
                      className="rounded-tile px-4 py-2 text-[13px]"
                    >
                      {selecting === a.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {t("jobDetail.select")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Phase: in progress */}
      {phase === "inProgress" && worker && (
        <section className="rounded-panel border border-line-3 bg-surface p-6">
          <p className="text-[12px] font-semibold tracking-[0.5px] text-ink-3">
            {t("jobDetail.selectedWorker")}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Avatar name={worker.name} index={worker.avatarIndex} size={48} />
            <div>
              <p className="text-sm font-semibold text-ink">{worker.name}</p>
              <p className="text-[12px] text-ink-3">{worker.role} · {worker.rate} zł/h</p>
            </div>
          </div>
          <Button
            variant="dark"
            onClick={confirm}
            disabled={confirming}
            className="mt-5 rounded-tile px-5 py-2.5 text-sm"
          >
            {confirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("jobDetail.confirming")}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {t("jobDetail.confirm")}
              </>
            )}
          </Button>
        </section>
      )}

      {/* Phase: completed */}
      {phase === "completed" && worker && (
        <section className="rounded-panel border border-success-chip bg-success-chip/30 p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-chip text-success-chip-text">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-lg font-bold text-ink">{t("jobDetail.completedTitle")}</h2>
          {reviewed ? (
            <p className="mt-2 text-sm text-ink-2">{t("jobDetail.reviewSuccessDesc")}</p>
          ) : (
            <Button
              variant="dark"
              onClick={() => setReviewOpen(true)}
              className="mt-4 rounded-tile px-5 py-2.5 text-sm"
            >
              <Star className="h-4 w-4" />
              {t("jobDetail.leaveReview")}
            </Button>
          )}
          {!dispute && (
            <button
              onClick={() => setDisputeOpen(true)}
              className="mt-3 block w-full text-center text-[12px] font-medium text-ink-4 hover:text-danger"
            >
              {t("dispute.openButton")}
            </button>
          )}
        </section>
      )}

      {/* Active mediation */}
      {dispute && <MediationView dispute={dispute} />}

      {worker && (
        <OpenDisputeDialog
          open={disputeOpen}
          onClose={() => setDisputeOpen(false)}
          jobId={id}
          counterparty={worker.name}
          onOpened={(d) => {
            setDispute(d);
            setDisputeOpen(false);
          }}
        />
      )}

      <ReviewDialog
        open={reviewOpen}
        jobId={id}
        workerId={worker?.id ?? ""}
        onClose={() => setReviewOpen(false)}
        onDone={() => {
          setReviewed(true);
          setReviewOpen(false);
        }}
      />
    </div>
  );
}

function ReviewDialog({
  open,
  jobId,
  workerId,
  onClose,
  onDone,
}: {
  open: boolean;
  jobId: string;
  workerId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await reviewsService.submit(jobId, workerId, rating, text);
      // Refresh the reviewed specialist's public reviews if cached.
      await queryClient.invalidateQueries({ queryKey: ["reviews", workerId] });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={done ? undefined : t("jobDetail.reviewTitle")}>
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
              <button key={n} onClick={() => setRating(n)} aria-label={`${n}`}>
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    n <= rating ? "fill-current text-[#e0a400]" : "text-line-4",
                  )}
                />
              </button>
            ))}
          </div>
          <label className="mb-1.5 mt-2 block text-[12px] font-semibold text-ink-3">
            {t("jobDetail.reviewComment")}
          </label>
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
