"use client";

import { useState } from "react";
import { SearchToggle } from "./SearchToggle";
import { HeroSearch } from "./HeroSearch";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { SearchMode, Specialization } from "@/lib/types";

export function Hero({ seedKeys = [] }: { seedKeys?: Specialization[] }) {
  const { t } = useI18n();
  const { user } = useAuth();
  // Default the mode to the user's side of the marketplace (specialist → looking for work);
  // a manual toggle (`override`) wins. Derived, so no effect/setState dance.
  const [override, setOverride] = useState<SearchMode | null>(null);
  const mode: SearchMode = override ?? (user?.role === "specialist" ? "job" : "worker");

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

      <HeroSearch mode={mode} seedKeys={seedKeys} />
    </section>
  );
}
