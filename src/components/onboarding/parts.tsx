"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

/** Centered onboarding card with brand header and a stepped progress bar. */
export function OnboardingCard({
  step,
  total,
  stepLabel,
  children,
}: {
  step: number;
  total: number;
  stepLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-[460px] animate-fade-up rounded-card border border-line-3 bg-surface p-7 shadow-search sm:p-8">
      <div className="flex items-center justify-between">
        <Link href="/" aria-label="skill.com">
          <Logo />
        </Link>
        <span className="text-[12px] font-medium text-ink-3">{stepLabel}</span>
      </div>
      <div className="mt-4 flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < step ? "bg-ink" : "bg-line-2",
            )}
          />
        ))}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold tracking-[-0.5px] text-ink">{title}</h1>
      {subtitle && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{subtitle}</p>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-ink-3">{label}</label>
      {children}
    </div>
  );
}

export const fieldInput =
  "w-full rounded-tile border border-line-2 bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink";

/** Selectable chip — used for industries, specializations and languages. */
export function Chip({
  label,
  selected,
  check = false,
  onClick,
}: {
  label: string;
  selected: boolean;
  check?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors",
        selected
          ? check
            ? "border-success-badge bg-success-chip text-success-chip-text"
            : "border-ink bg-ink text-on-dark"
          : "border-line-2 text-ink hover:bg-muted",
      )}
    >
      {check && selected && <Check className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
