"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Check, X, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { VerifyNotice } from "@/components/layout/VerifyNotice";
import { jobsService, accountService } from "@/services";
import { jobRateLabel } from "@/lib/jobRate";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/ToastProvider";
import { requestErrorToast } from "@/lib/errorToast";
import { cn } from "@/lib/cn";
import type { MySpecialistProfile } from "@/services";
import type { JobPosting } from "@/lib/types";

/** Which catalog attribute codes the specialist's profile satisfies (bool=true / has option / has value). */
function satisfiedCodes(profile: MySpecialistProfile | null | undefined): Set<string> {
  const set = new Set<string>();
  for (const a of profile?.attributes ?? []) {
    if (a.boolValue === true || a.optionCode || a.textValue || a.dateValue) set.add(a.attributeCode);
  }
  return set;
}

/** Apply-to-a-job dialog (specialist). Handles login / verify / role gating + the message form +
 *  the job's optional requirements (catalog creds auto-matched from the profile, custom self-checked). */
export function ApplyDialog({ job, onClose }: { job: JobPosting | null; onClose: () => void }) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const { show } = useToast();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [customChecked, setCustomChecked] = useState<Record<string, boolean>>({});

  const isSpecialist = !!user && user.emailVerified && user.role === "specialist";
  // Fetch the job's requirements (the passed posting may come from a list without them) + the
  // specialist's own profile to auto-match catalog requirements.
  const { data: detail } = useQuery({
    queryKey: ["jobApplyDetail", job?.id, locale],
    queryFn: () => jobsService.getById(job!.id, locale),
    enabled: !!job && isSpecialist,
  });
  const { data: profile } = useQuery({
    queryKey: ["mySpecialistProfile", locale],
    queryFn: () => accountService.getMySpecialistProfile(locale),
    enabled: !!job && isSpecialist,
  });
  const requirements = detail?.requirements ?? job?.requirements ?? [];
  const satisfied = satisfiedCodes(profile);
  const isMet = (r: { key: string; attributeCode: string | null }) =>
    r.attributeCode ? satisfied.has(r.attributeCode) : !!customChecked[r.key];

  async function send() {
    if (!job || !text.trim()) return;
    setSending(true);
    try {
      const metKeys = requirements.filter(isMet).map((r) => r.key);
      await jobsService.apply(job.id, text, metKeys);
      setSent(true);
    } catch (e) {
      show(requestErrorToast(e, t));
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={!!job} onClose={onClose} title={sent ? undefined : t("jobs.applyTitle")}>
      {!job ? null : sent ? (
        <div className="py-2 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-chip text-success-chip-text">
            <Check className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-lg font-bold text-ink">{t("jobs.applySuccessTitle")}</h2>
          <p className="mt-1 text-sm text-ink-2">{t("jobs.applySuccessDesc")}</p>
          <Button variant="dark" onClick={onClose} className="mt-5 w-full rounded-tile py-3 text-sm">
            {t("contact.done")}
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-tile bg-subtle p-3">
            <p className="text-sm font-semibold text-ink">{job.title}</p>
            <p className="text-[12px] text-ink-3">
              {job.employerId ? (
                <Link href={`/employer/${job.employerId}`} className="font-medium text-brand-violet hover:underline">
                  {job.employer}
                </Link>
              ) : (
                job.employer
              )}
              {" · "}{job.district} · {jobRateLabel(job, t)}
            </p>
          </div>
          {!user ? (
            <div className="mt-4 rounded-tile border border-line-2 p-4 text-center">
              <p className="text-sm text-ink-2">{t("jobs.applyLoginRequired")}</p>
              <a
                href="/login"
                className="mt-3 inline-flex w-full items-center justify-center rounded-tile bg-ink px-4 py-2.5 text-sm font-bold text-on-dark hover:bg-ink/90"
              >
                {t("contact.loginCta")}
              </a>
            </div>
          ) : !user.emailVerified ? (
            <VerifyNotice variant="panel" message={t("verify.noticeContact")} className="mt-4" />
          ) : user.role !== "specialist" ? (
            <div className="mt-4 rounded-tile border border-line-2 bg-muted p-4 text-center text-[13px] text-ink-2">
              {t("jobs.applySpecialistsOnly")}
            </div>
          ) : (
            <>
              {requirements.length > 0 && (
                <div className="mt-4 rounded-tile border border-line-2 p-3">
                  <p className="mb-2 text-[12px] font-semibold text-ink-3">{t("jobs.applyRequirements")}</p>
                  <ul className="flex flex-col gap-1.5">
                    {requirements.map((r) => {
                      const met = isMet(r);
                      const coded = !!r.attributeCode;
                      return (
                        <li key={r.key}>
                          {coded ? (
                            // Catalog requirement → auto-matched from the profile (read-only).
                            <div className="flex items-center gap-2 text-[13px]">
                              <span className={cn("grid h-4 w-4 place-items-center rounded-full", met ? "bg-success-chip text-success-chip-text" : "bg-muted text-ink-4")}>
                                {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              </span>
                              <span className={met ? "text-ink" : "text-ink-3"}>{r.label}</span>
                              {!met && <span className="text-[11px] text-ink-4">· {t("jobs.applyReqMissing")}</span>}
                            </div>
                          ) : (
                            // Custom requirement → the specialist self-declares.
                            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink">
                              <input
                                type="checkbox"
                                checked={!!customChecked[r.key]}
                                onChange={(e) => setCustomChecked((m) => ({ ...m, [r.key]: e.target.checked }))}
                                className="h-4 w-4 accent-brand-violet"
                              />
                              {r.label}
                            </label>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <label className="mb-1.5 mt-4 block text-[12px] font-semibold text-ink-3">
                {t("jobs.applyMessageLabel")}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder={t("jobs.applyPlaceholder")}
                className="w-full resize-y rounded-tile border border-line-2 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink placeholder:text-ink-4"
              />
              <Button
                variant="gradient"
                onClick={send}
                disabled={sending}
                className="mt-3 w-full rounded-tile py-3 text-sm"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("jobs.applySending")}
                  </>
                ) : (
                  t("jobs.applySend")
                )}
              </Button>
            </>
          )}
        </>
      )}
    </Dialog>
  );
}
