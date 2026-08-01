"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { QuickRegisterForm } from "@/components/auth/QuickRegisterForm";
import { QuickInterviewForm, type QuickInterviewResult } from "@/components/auth/QuickInterviewForm";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * The signed-out specialist gate CONTENT (no dialog chrome): register (quick form → mini
 * interview) / login link / subtle skip. Embedded by JobsAuthGate (as a modal over the job
 * results) and by ApplyDialog (inline, when a signed-out user hits "Aplikuj").
 */
export function AuthGateFlow({
  onSkip,
  onFinished,
  skipLabel,
  loginRedirect = "/jobs",
}: {
  /** "Skip" (or cancel) — the caller decides what leaving the gate means in its context. */
  onSkip: () => void;
  /** Quick interview saved — caller applies what was picked (or ignores it). */
  onFinished: (picked: QuickInterviewResult) => void;
  /** Override the skip button label (default: "browse without an account"). */
  skipLabel?: string;
  /** Where /login should return to. */
  loginRedirect?: string;
}) {
  const { t } = useI18n();
  const [view, setView] = useState<"prompt" | "register" | "interview">("prompt");

  return (
    <>
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="mb-2 grid h-14 w-14 place-items-center rounded-full bg-[#eef1ff] text-brand-violet">
          <Briefcase className="h-7 w-7" />
        </span>
        <h2 className="text-xl font-bold tracking-[-0.5px] text-ink">
          {t(view === "register" ? "hero.qrTitle" : view === "interview" ? "hero.ivTitle" : "hero.authPromptTitle")}
        </h2>
        <p className="max-w-[340px] text-[13px] leading-snug text-ink-3">
          {t(view === "register" ? "hero.qrDesc" : view === "interview" ? "hero.ivDesc" : "hero.authPromptDesc")}
        </p>
      </div>

      {view === "interview" ? (
        <div className="mt-5">
          {/* The "mini interview": saving publishes the profile; skipping continues without it
              (the dashboard checklist picks up the rest). */}
          <QuickInterviewForm onDone={onFinished} onSkip={onSkip} />
        </div>
      ) : view === "prompt" ? (
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setView("register")}
            className="inline-flex w-full cursor-pointer items-center justify-center rounded-tile bg-ink py-3 text-sm font-bold text-on-dark transition-colors hover:bg-ink/90"
          >
            {t("hero.authPromptRegister")}
          </button>
          <Link
            href={`/login?redirect=${encodeURIComponent(loginRedirect)}`}
            className="inline-flex w-full items-center justify-center rounded-tile border border-line-2 bg-surface py-3 text-sm font-semibold text-ink transition-colors hover:bg-muted"
          >
            {t("hero.authPromptLogin")}
          </Link>
          <button
            type="button"
            onClick={onSkip}
            className="mt-1 cursor-pointer text-center text-[13px] font-medium text-ink-4 transition-colors hover:text-ink"
          >
            {skipLabel ?? t("hero.authPromptSkip")}
          </button>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2.5">
          {/* Account only — no e-mail verification, no wizard. Next: the compact mini-interview
              (skippable) so employers can actually find the fresh account. */}
          <QuickRegisterForm role="specialist" onRegistered={() => setView("interview")} />
          <button
            type="button"
            onClick={() => setView("prompt")}
            className="cursor-pointer text-center text-[13px] font-medium text-ink-4 transition-colors hover:text-ink"
          >
            {t("hero.qrBack")}
          </button>
        </div>
      )}
    </>
  );
}
