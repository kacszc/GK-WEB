"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/I18nProvider";

const modes = [
  { id: "worker", tKey: "hero.toggleWorker" },
  { id: "job", tKey: "hero.toggleJob" },
] as const;

export function SearchToggle() {
  const { t } = useI18n();
  const [active, setActive] = useState<(typeof modes)[number]["id"]>("worker");
  const activeIndex = modes.findIndex((m) => m.id === active);

  return (
    <div
      role="tablist"
      aria-label="Tryb wyszukiwania"
      className="relative grid grid-cols-2 rounded-full border border-line-2 bg-surface p-1"
    >
      {/* Sliding indicator */}
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-full bg-ink transition-transform duration-300 ease-out"
        style={{
          width: "calc(50% - 0.25rem)",
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {modes.map((mode) => {
        const selected = active === mode.id;
        return (
          <button
            key={mode.id}
            role="tab"
            aria-selected={selected}
            onClick={() => setActive(mode.id)}
            className={cn(
              "relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer",
              selected ? "text-on-dark" : "text-ink-3 hover:text-ink",
            )}
          >
            {t(mode.tKey)}
          </button>
        );
      })}
    </div>
  );
}
