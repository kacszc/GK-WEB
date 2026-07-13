"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import { SearchToggle } from "./SearchToggle";
import { HeroSearch } from "./HeroSearch";
import { Dialog } from "@/components/ui/Dialog";
import { useRouter } from "next/navigation";
import { QuickRegisterForm } from "@/components/auth/QuickRegisterForm";
import { QuickInterviewForm, type QuickInterviewResult } from "@/components/auth/QuickInterviewForm";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { accountService } from "@/services";
import { cn } from "@/lib/cn";
import type { SearchMode, Specialization } from "@/lib/types";

export function Hero({ seedKeys = [] }: { seedKeys?: Specialization[] }) {
  const { t, locale } = useI18n();
  const { user, ready } = useAuth();
  const router = useRouter();
  // Default the mode to the user's side of the marketplace (specialist → looking for work);
  // a manual toggle (`override`) wins. Derived, so no effect/setState dance.
  const [override, setOverride] = useState<SearchMode | null>(null);
  const mode: SearchMode = override ?? (user?.role === "specialist" ? "job" : "worker");

  // Signed-in specialist searching with an EMPTY box: default the results to their own
  // specialization instead of "everything" (same cache key as ProfileNudge/ProfileChecklist).
  const { data: myProfile } = useQuery({
    queryKey: ["profileCompleteness", user?.role, locale],
    queryFn: () => accountService.getMySpecialistProfile(locale),
    enabled: ready && user?.role === "specialist",
    staleTime: 5 * 60_000,
  });
  const defaultProfessionCode = myProfile?.specializationCodes?.[0];

  // "Szukam pracy" is the key conversion entry for specialists. A signed-out job SEARCH (the
  // toggle itself stays free) gets a soft auth gate: quick in-modal registration / login link /
  // a subtle skip. Skip or a successful registration resumes the intercepted search.
  const [authPrompt, setAuthPrompt] = useState(false);
  const [promptView, setPromptView] = useState<"prompt" | "register" | "interview">("prompt");
  const skippedRef = useRef(false);
  const pendingSearchRef = useRef<(() => void) | null>(null);

  function jobGate(proceed: () => void): boolean {
    if (!ready || user || skippedRef.current) return false;
    pendingSearchRef.current = proceed;
    setPromptView("prompt");
    setAuthPrompt(true);
    return true;
  }

  function resumeSearch() {
    setAuthPrompt(false);
    pendingSearchRef.current?.();
    pendingSearchRef.current = null;
  }

  function skipGate() {
    skippedRef.current = true;
    resumeSearch();
  }

  // Interview saved: land on /jobs pre-filtered by what was just picked (profession beats the
  // whole industry). Nothing picked → just resume the originally intercepted search.
  function finishInterview(picked: QuickInterviewResult) {
    if (!picked.professionCode && !picked.industryCode) {
      resumeSearch();
      return;
    }
    setAuthPrompt(false);
    pendingSearchRef.current = null;
    const params = new URLSearchParams();
    if (picked.professionCode) params.set("profession", picked.professionCode);
    else if (picked.industryCode) params.set("industry", picked.industryCode);
    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <section className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-8 px-4 pb-8 pt-12 sm:px-8 sm:pt-16">
      {user && (
        <p className="-mb-4 text-[13px] font-medium text-ink-3">{t("account.greeting", { name: user.name })}</p>
      )}
      <SearchToggle mode={mode} onChange={setOverride} />

      <h1
        key={mode}
        className={cn(
          "text-center text-4xl font-bold leading-[1.05] tracking-[-1.5px] text-ink sm:text-5xl",
          mode === "job" ? "animate-swap-right" : "animate-swap-left",
        )}
      >
        {t(`mode.${mode}.title`)}
      </h1>

      <HeroSearch
        mode={mode}
        seedKeys={seedKeys}
        gate={mode === "job" ? jobGate : undefined}
        defaultProfessionCode={mode === "job" ? defaultProfessionCode : undefined}
      />

      <Dialog
        open={authPrompt}
        onClose={() => {
          // Backdrop/Escape: drop the intercepted search (no silent skip) — next Szukaj asks again.
          setAuthPrompt(false);
          pendingSearchRef.current = null;
        }}
      >
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="mb-2 grid h-14 w-14 place-items-center rounded-full bg-[#eef1ff] text-brand-violet">
            <Briefcase className="h-7 w-7" />
          </span>
          <h2 className="text-xl font-bold tracking-[-0.5px] text-ink">
            {t(promptView === "register" ? "hero.qrTitle" : promptView === "interview" ? "hero.ivTitle" : "hero.authPromptTitle")}
          </h2>
          <p className="max-w-[340px] text-[13px] leading-snug text-ink-3">
            {t(promptView === "register" ? "hero.qrDesc" : promptView === "interview" ? "hero.ivDesc" : "hero.authPromptDesc")}
          </p>
        </div>

        {promptView === "interview" ? (
          <div className="mt-5">
            {/* The stakeholder "mini interview": one compact card — saving publishes the profile,
                skipping just continues the intercepted search (checklist picks up the rest). */}
            <QuickInterviewForm onDone={finishInterview} onSkip={resumeSearch} />
          </div>
        ) : promptView === "prompt" ? (
          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setPromptView("register")}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-tile bg-ink py-3 text-sm font-bold text-on-dark transition-colors hover:bg-ink/90"
            >
              {t("hero.authPromptRegister")}
            </button>
            <Link
              href="/login?redirect=/"
              className="inline-flex w-full items-center justify-center rounded-tile border border-line-2 bg-surface py-3 text-sm font-semibold text-ink transition-colors hover:bg-muted"
            >
              {t("hero.authPromptLogin")}
            </Link>
            <button
              type="button"
              onClick={skipGate}
              className="mt-1 cursor-pointer text-center text-[13px] font-medium text-ink-4 transition-colors hover:text-ink"
            >
              {t("hero.authPromptSkip")}
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-2.5">
            {/* Account only — no e-mail verification, no wizard. Next: the compact mini-interview
                (skippable) so employers can actually find the fresh account. */}
            <QuickRegisterForm role="specialist" onRegistered={() => setPromptView("interview")} />
            <button
              type="button"
              onClick={() => setPromptView("prompt")}
              className="cursor-pointer text-center text-[13px] font-medium text-ink-4 transition-colors hover:text-ink"
            >
              {t("hero.qrBack")}
            </button>
          </div>
        )}
      </Dialog>
    </section>
  );
}
