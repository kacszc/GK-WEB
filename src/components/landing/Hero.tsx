"use client";

import { useState } from "react";
import { SearchToggle } from "./SearchToggle";
import { HeroSearch } from "./HeroSearch";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { SearchMode, Specialization } from "@/lib/types";

export function Hero({ seedKeys = [] }: { seedKeys?: Specialization[] }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<SearchMode>("worker");

  return (
    <section className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-8 px-4 pb-8 pt-12 sm:px-8 sm:pt-16">
      <SearchToggle mode={mode} onChange={setMode} />

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
