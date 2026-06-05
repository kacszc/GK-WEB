"use client";

import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/I18nProvider";
import type { SearchMode } from "@/lib/types";

const modes: { id: SearchMode; tKey: string }[] = [
  { id: "worker", tKey: "hero.toggleWorker" },
  { id: "job", tKey: "hero.toggleJob" },
];

export function SearchToggle({
  mode,
  onChange,
}: {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}) {
  const { t } = useI18n();
  const activeIndex = modes.findIndex((m) => m.id === mode);

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
      {modes.map((m) => {
        const selected = mode === m.id;
        return (
          <button
            key={m.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(m.id)}
            className={cn(
              "relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer",
              selected ? "text-on-dark" : "text-ink-3 hover:text-ink",
            )}
          >
            {t(m.tKey)}
          </button>
        );
      })}
    </div>
  );
}
