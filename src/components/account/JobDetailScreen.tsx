"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Star, Check, X, Loader2, CheckCircle2, MessageSquare, Pencil, Eye, EyeOff, Rocket, Sparkles } from "lucide-react";
import { accountService, jobsService } from "@/services";
import { isPromoted, formatPromotedUntil } from "@/lib/promotion";
import { BoostJobDialog } from "@/components/account/BoostJobDialog";
import { MessageComposerDialog, type MessageTarget } from "@/components/messages/MessageComposerDialog";
import { jobRateLabel } from "@/lib/jobRate";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { OpenDisputeDialog } from "@/components/dispute/OpenDisputeDialog";
import { MediationView } from "@/components/dispute/MediationView";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { EditJobDialog } from "@/components/post-job/EditJobDialog";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/lib/ToastProvider";
import { requestErrorToast } from "@/lib/errorToast";
import { cn } from "@/lib/cn";
import type { Applicant, Dispute } from "@/lib/types";

type Phase = "applicants" | "inProgress" | "completed";

export function JobDetailScreen({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const { data: job } = useQuery({ queryKey: ["job", id], queryFn: () => accountService.getJob(id) });
  const { data: applicants = [], isLoading } = useQuery({
    queryKey: ["applicants", id],
    queryFn: () => accountService.getApplicants(id),
  });

  // Phase is derived from the server job status (+ the selected applicant), so it survives a
  // page reload — the employer can't accidentally re-open the applicant list after picking someone.
  const phase: Phase =
    job?.status === "completed" ? "completed" : job?.status === "filled" ? "inProgress" : "applicants";
  const worker = useMemo(() => applicants.find((a) => a.status === "SELECTED") ?? null, [applicants]);

  const [selecting, setSelecting] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmingSkill, setConfirmingSkill] = useState(false);
  const [skillConfirmed, setSkillConfirmed] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [msgTo, setMsgTo] = useState<MessageTarget | null>(null);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [reopening, setReopening] = useState(false);

  // Publish a draft / re-show an unpublished job, or hide an active one — owner lifecycle controls.
  async function setPublished(publish: boolean) {
    setLifecycleBusy(true);
    try {
      await (publish ? jobsService.publish(id) : jobsService.unpublish(id));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["job", id] }),
        queryClient.invalidateQueries({ queryKey: ["myJobs"] }),
      ]);
      show({ title: t(publish ? "jobDetail.publishedToast" : "jobDetail.unpublishedToast") });
    } catch (e) {
      show(requestErrorToast(e, t));
    } finally {
      setLifecycleBusy(false);
    }
  }

  async function select(a: Applicant) {
    if (!a.applicationId) return;
    setSelecting(a.id);
    try {
      await accountService.selectApplicant(id, a.applicationId);
      // Refetch so the derived phase/worker reflect the new server state.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["applicants", id] }),
        queryClient.invalidateQueries({ queryKey: ["job", id] }),
        queryClient.invalidateQueries({ queryKey: ["myJobs"] }),
      ]);
    } finally {
      setSelecting(null);
    }
  }

  async function reopen() {
    if (!reopenReason.trim()) return;
    setReopening(true);
    try {
      await accountService.reopenJob(id, reopenReason.trim());
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["applicants", id] }),
        queryClient.invalidateQueries({ queryKey: ["job", id] }),
        queryClient.invalidateQueries({ queryKey: ["myJobs"] }),
      ]);
      setReopenOpen(false);
      setReopenReason("");
      show({ title: t("jobDetail.reopenedToast") });
    } catch (e) {
      show(requestErrorToast(e, t));
    } finally {
      setReopening(false);
    }
  }

  async function confirm() {
    setConfirming(true);
    try {
      await accountService.confirmCompletion(id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["job", id] }),
        queryClient.invalidateQueries({ queryKey: ["myJobs"] }),
      ]);
    } finally {
      setConfirming(false);
    }
  }

  // Employer confirms the worker's hired specialization (only for catalog roles, not "Other").
  async function confirmSkill() {
    if (!worker?.id || !job?.professionCode) return;
    setConfirmingSkill(true);
    try {
      await accountService.confirmSpecialization(worker.id, job.professionCode, id);
      await queryClient.invalidateQueries({ queryKey: ["specialist", worker.id] });
      setSkillConfirmed(true);
    } catch (e) {
      show(requestErrorToast(e, t));
    } finally {
      setConfirmingSkill(false);
    }
  }

  const statusBadge =
    job?.status === "draft"
      ? { text: t("jobDetail.statusDraft"), cls: "bg-pill text-ink-2" }
      : job?.status === "unpublished"
        ? { text: t("jobDetail.statusUnpublished"), cls: "bg-pill text-ink-3" }
        : phase === "inProgress"
          ? { text: t("jobDetail.statusInProgress"), cls: "bg-[#fdf0cf] text-[#8a6400]" }
          : phase === "completed"
            ? { text: t("jobDetail.statusCompleted"), cls: "bg-success-chip text-success-chip-text" }
            : job?.status === "active"
              ? { text: t("jobDetail.statusActive"), cls: "bg-success-chip text-success-chip-text" }
              : null;

  // Owner lifecycle controls: edit unless completed; publish a draft/hidden job, or hide an active one.
  const canEdit = job != null && job.status !== "completed";
  const canPublish = job?.status === "draft" || job?.status === "unpublished";
  const canUnpublish = job?.status === "active";

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
          {job.profession} · {job.district} ·{" "}
          {jobRateLabel(
            { rate: job.rate, rateDisclosed: job.rateDisclosed, currency: job.currency, rateType: job.rateType },
            t,
          )}
        </p>
      )}

      {/* Owner lifecycle controls — edit / publish / unpublish. */}
      {(canEdit || canPublish || canUnpublish) && (
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-tile border border-line-2 bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("jobDetail.edit")}
            </button>
          )}
          {canPublish && (
            <Button
              variant="dark"
              onClick={() => setPublished(true)}
              disabled={lifecycleBusy}
              className="rounded-tile px-3.5 py-2 text-[13px]"
            >
              {lifecycleBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
              {t("jobDetail.publish")}
            </Button>
          )}
          {canUnpublish && (
            <button
              onClick={() => setPublished(false)}
              disabled={lifecycleBusy}
              className="inline-flex items-center gap-1.5 rounded-tile border border-line-2 bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-muted disabled:opacity-60"
            >
              {lifecycleBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <EyeOff className="h-3.5 w-3.5" />}
              {t("jobDetail.unpublish")}
            </button>
          )}
          {/* Promote: only an active job can be boosted; while promoted, show the end date instead. */}
          {job?.status === "active" &&
            (isPromoted(job.promotedUntil) ? (
              <span className="inline-flex items-center gap-1.5 rounded-tile bg-[#f3effe] px-3.5 py-2 text-[13px] font-medium text-brand-violet">
                <Sparkles className="h-3.5 w-3.5" />
                {t("account.promotedUntil", { date: formatPromotedUntil(job.promotedUntil!, locale) })}
              </span>
            ) : (
              <button
                onClick={() => setBoostOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-tile border border-line-2 bg-surface px-3.5 py-2 text-[13px] font-medium text-brand-violet transition-colors hover:bg-muted"
              >
                <Rocket className="h-3.5 w-3.5" />
                {t("jobDetail.promote")}
              </button>
            ))}
        </div>
      )}

      {/* Draft/hidden jobs have no public applicants yet — explain the state. */}
      {(job?.status === "draft" || job?.status === "unpublished") && (
        <p className="rounded-panel border border-dashed border-line-2 bg-muted/40 px-4 py-3 text-[13px] text-ink-2">
          {t(job.status === "draft" ? "jobDetail.draftHint" : "jobDetail.unpublishedHint")}
        </p>
      )}

      {/* Phase: applicants (hidden for not-yet-public draft/unpublished jobs) */}
      {phase === "applicants" && job?.status !== "draft" && job?.status !== "unpublished" && (
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
                        <span className="text-[11px] text-ink-4">{a.appliedAgo}</span>
                      </div>
                      {a.role && (
                        <p className="text-[12px] text-ink-3">
                          {a.role} · <MapPin className="inline h-3 w-3" /> {a.district} · ★ {a.rating.toFixed(1)} ({a.reviews}) · {t(a.rateType === "monthly" ? "results.perMonth" : "results.perHour", { rate: a.rate })}
                        </p>
                      )}
                      <p className="mt-2 text-[13px] text-ink-2">{a.message}</p>
                      {(a.requirements?.length ?? 0) > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {a.requirements!.map((r, i) => (
                            <span
                              key={i}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                                r.met ? "bg-success-chip text-success-chip-text" : "bg-muted text-ink-4",
                              )}
                            >
                              {r.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              {r.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setMsgTo({ id: a.id, name: a.name, jobId: id, jobTitle: job?.title })}
                      className="rounded-tile px-4 py-2 text-[13px]"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {t("jobDetail.message")}
                    </Button>
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
              <p className="text-[12px] text-ink-3">{worker.role} · {t(worker.rateType === "monthly" ? "results.perMonth" : "results.perHour", { rate: worker.rate })}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setMsgTo({ id: worker.id, name: worker.name, jobId: id, jobTitle: job?.title })}
              className="rounded-tile px-5 py-2.5 text-sm"
            >
              <MessageSquare className="h-4 w-4" />
              {t("jobDetail.message")}
            </Button>
            <Button
              variant="dark"
              onClick={confirm}
              disabled={confirming}
              className="rounded-tile px-5 py-2.5 text-sm"
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
            <Button
              variant="outline"
              onClick={() => setReopenOpen(true)}
              className="rounded-tile px-5 py-2.5 text-sm"
            >
              {t("jobDetail.reopen")}
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-ink-4">{t("jobDetail.reopenHint")}</p>
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
          {/* One-click confirmation of the hired specialization (catalog roles only). */}
          {job?.professionCode && (
            skillConfirmed ? (
              <p className="mt-3 inline-flex items-center justify-center gap-1.5 text-[13px] font-medium text-success-chip-text">
                <Check className="h-4 w-4" />
                {t("jobDetail.skillConfirmed")}
              </p>
            ) : (
              <Button
                variant="outline"
                onClick={confirmSkill}
                disabled={confirmingSkill}
                className="mt-3 rounded-tile px-5 py-2.5 text-sm"
              >
                {confirmingSkill ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {t("jobDetail.confirmSkill", { skill: job.profession })}
              </Button>
            )
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
          counterpartyId={worker.id}
          onOpened={(d) => {
            // Show the worker's display name in the mediation heading rather than
            // the raw counterparty id the backend echoes back.
            setDispute({ ...d, counterparty: worker.name });
            setDisputeOpen(false);
          }}
        />
      )}

      <ReviewDialog
        open={reviewOpen}
        jobId={id}
        subjectId={worker?.id ?? ""}
        subjectKind="worker"
        onClose={() => setReviewOpen(false)}
        onDone={() => {
          setReviewed(true);
          setReviewOpen(false);
        }}
      />

      <MessageComposerDialog target={msgTo} onClose={() => setMsgTo(null)} />

      <EditJobDialog
        jobId={id}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      <BoostJobDialog
        job={boostOpen && job ? { id, title: job.title } : null}
        onClose={() => setBoostOpen(false)}
      />

      <Dialog open={reopenOpen} onClose={() => setReopenOpen(false)} title={t("jobDetail.reopenTitle")}>
        <p className="text-sm leading-relaxed text-ink-2">{t("jobDetail.reopenDesc")}</p>
        <label className="mt-4 block text-[12px] font-semibold text-ink-3">{t("jobDetail.reopenReasonLabel")}</label>
        <textarea
          value={reopenReason}
          onChange={(e) => setReopenReason(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder={t("jobDetail.reopenReasonPlaceholder")}
          className="mt-1.5 w-full resize-y rounded-tile border border-line-2 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink placeholder:text-ink-4"
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setReopenOpen(false)} className="rounded-tile px-4 py-2.5 text-sm">
            {t("portfolio.cancel")}
          </Button>
          <Button variant="dark" onClick={reopen} disabled={reopening || !reopenReason.trim()} className="rounded-tile px-4 py-2.5 text-sm disabled:opacity-40">
            {reopening ? <Loader2 className="h-4 w-4 animate-spin" /> : t("jobDetail.reopen")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
