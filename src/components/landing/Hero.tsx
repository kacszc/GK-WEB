"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Search, ArrowRight } from "lucide-react";
import { SearchToggle } from "./SearchToggle";
import { HeroSearch } from "./HeroSearch";
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

  // First screen for signed-out visitors: JUST the two big buttons (corridor-tested — the old
  // toggle looked like buttons but only swapped the headline, so "nothing happened"). Picking
  // "pracownika" reveals the search panel; picking "pracy" goes straight to the job proposals,
  // where the auth gate modal shows OVER the results (never on an empty screen).
  // The choice screen is ALSO the SSR/loading state: real content (h1 + buttons) for bots and
  // instant paint for the signed-out majority; a signed-in session swaps it for the panel as
  // soon as auth restores.
  const showChoice = (!ready || !user) && override === null;
  const gateJobSearch = !user;

  // Signed-out "Szukam pracy" ALWAYS acts the same (stakeholder rule: login or proposals) —
  // also when flipped via the toggle after picking "pracownika" first.
  function changeMode(m: SearchMode) {
    if (m === "job" && ready && !user) {
      router.push("/jobs?authPrompt=1");
      return;
    }
    setOverride(m);
  }

  if (showChoice) {
    return (
      <section className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-8 px-4 pb-10 pt-12 sm:px-8 sm:pt-20">
        <h1 className="text-center text-3xl font-bold leading-[1.1] tracking-[-1px] text-ink sm:text-4xl">
          {t("hero.chooseTitle")}
        </h1>
        <div className="grid w-full max-w-[760px] gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setOverride("worker")}
            className="group flex cursor-pointer flex-col gap-3 rounded-card bg-ink p-6 text-left shadow-search transition hover:-translate-y-1 hover:shadow-xl sm:p-8"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-on-dark">
              <Search className="h-5 w-5" />
            </span>
            <span className="flex items-center gap-2 text-xl font-bold text-on-dark sm:text-2xl">
              {t("hero.toggleWorker")}
              <ArrowRight className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
            <span className="text-[13px] leading-snug text-on-dark/70">{t("hero.chooseWorkerDesc")}</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/jobs?authPrompt=1")}
            className="group flex cursor-pointer flex-col gap-3 rounded-card border-2 border-line-2 bg-surface p-6 text-left shadow-search transition hover:-translate-y-1 hover:border-ink/30 hover:shadow-xl sm:p-8"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#eef1ff] text-brand-violet">
              <Briefcase className="h-5 w-5" />
            </span>
            <span className="flex items-center gap-2 text-xl font-bold text-ink sm:text-2xl">
              {t("hero.toggleJob")}
              <ArrowRight className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
            <span className="text-[13px] leading-snug text-ink-3">{t("hero.chooseJobDesc")}</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-8 px-4 pb-8 pt-12 sm:px-8 sm:pt-16">
      {user && (
        <p className="-mb-4 text-[13px] font-medium text-ink-3">{t("account.greeting", { name: user.name })}</p>
      )}
      <SearchToggle mode={mode} onChange={changeMode} />

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
        // Signed-out job searches land on /jobs with the auth-gate modal over the results.
        appendAuthPrompt={mode === "job" && gateJobSearch}
        defaultProfessionCode={mode === "job" ? defaultProfessionCode : undefined}
      />
    </section>
  );
}
