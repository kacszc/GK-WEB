"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ArrowLeft,
  ArrowRight,
  IdCard,
  CalendarCheck,
  Briefcase,
  Rocket,
  ShieldCheck,
  FilePlus2,
  Search,
  Unlock,
  ListChecks,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";
import type { UserRole } from "@/lib/types";

const seenKey = (role: UserRole) => `skill_tour_seen_${role}`;

/**
 * Auto-opens the tour the first time a user lands on a screen that mounts it (after onboarding or the
 * first /account visit), once per role, and remembers it was seen. `reopen()` shows it again manually.
 * Mount this on both the onboarding success screens and /account so new users always get the tour.
 */
export function useTourAutoOpen(role: UserRole, ready: boolean) {
  // Derived (no effect): open when ready, not yet seen and not dismissed this session. `seen` is read
  // once from localStorage so a returning user isn't re-shown the tour. `reopen()` forces it open.
  const [seen, setSeen] = useState(() => typeof window !== "undefined" && !!localStorage.getItem(seenKey(role)));
  const [dismissed, setDismissed] = useState(false);
  const open = ready && !seen && !dismissed;
  const close = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(seenKey(role), "1");
    }
    setSeen(true);
    setDismissed(true);
  };
  const reopen = () => {
    setSeen(false);
    setDismissed(false);
  };
  return { open, close, reopen };
}

/** A finish-card CTA: a Link when it navigates, a button when it runs an action. Closes the tour after. */
function FinishButton({ action, onDone }: { action: TourAction; onDone: () => void }) {
  const cls = `inline-flex flex-1 items-center justify-center gap-2 rounded-tile px-4 py-2.5 text-sm font-bold transition-colors ${
    action.primary
      ? "bg-ink text-on-dark hover:bg-ink/90"
      : "border border-line-4 bg-surface text-ink hover:bg-muted"
  }`;
  if (action.href) {
    return (
      <Link href={action.href} onClick={onDone} className={cls}>
        {action.label}
      </Link>
    );
  }
  return (
    <button
      onClick={() => {
        action.onClick?.();
        onDone();
      }}
      className={cls}
    >
      {action.label}
    </button>
  );
}

/** Per-step illustration: a brand-tinted gradient panel with a big icon + soft decorative shapes.
 *  No external assets (Figma exports expire) — fully token/utility based so it stays on-brand. */
type Visual = { icon: LucideIcon; gradient: string };

const SPECIALIST_VISUALS: Visual[] = [
  { icon: IdCard, gradient: "from-brand-violet to-brand-blue" },
  { icon: CalendarCheck, gradient: "from-sky-500 to-cyan-400" },
  { icon: Briefcase, gradient: "from-indigo-500 to-violet-500" },
  { icon: Rocket, gradient: "from-amber-500 to-orange-500" },
  { icon: ShieldCheck, gradient: "from-emerald-500 to-teal-400" },
];

const EMPLOYER_VISUALS: Visual[] = [
  { icon: FilePlus2, gradient: "from-brand-violet to-brand-blue" },
  { icon: Search, gradient: "from-sky-500 to-cyan-400" },
  { icon: Unlock, gradient: "from-amber-500 to-orange-500" },
  { icon: ListChecks, gradient: "from-indigo-500 to-violet-500" },
  { icon: BarChart3, gradient: "from-emerald-500 to-teal-400" },
];

/** A call-to-action on the final tour card. `href` navigates; `onClick` runs an action. */
export type TourAction = { label: string; href?: string; onClick?: () => void; primary?: boolean };

/** Role/state-aware buttons shown on the last card (e.g. "Find work" + "Publish offer"). */
export function PlatformTour({
  open,
  onClose,
  role,
  finishActions,
}: {
  open: boolean;
  onClose: () => void;
  role: UserRole;
  finishActions?: TourAction[];
}) {
  // Mount only while open: the inner content's `step` state resets on every open (no reset effect).
  if (!open || typeof document === "undefined") return null;
  return <TourContent onClose={onClose} role={role} finishActions={finishActions} />;
}

function TourContent({
  onClose,
  role,
  finishActions,
}: {
  onClose: () => void;
  role: UserRole;
  finishActions?: TourAction[];
}) {
  const { t, dict } = useI18n();
  const [step, setStep] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const slides = role === "specialist" ? dict.tour.specialist : dict.tour.employer;
  const visuals = role === "specialist" ? SPECIALIST_VISUALS : EMPLOYER_VISUALS;
  const last = slides.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, last));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, last]);

  const slide = slides[step];
  const { icon: Icon, gradient } = visuals[step];
  const isLast = step === last;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40) setStep((s) => Math.min(s + 1, last));
    else if (dx > 40) setStep((s) => Math.max(s - 1, 0));
    touchStartX.current = null;
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={onClose} />
      <div
        className="relative z-10 max-h-[92dvh] w-full animate-dialog-in overflow-hidden rounded-t-card border border-line bg-surface shadow-dropdown sm:max-w-[440px] sm:rounded-card"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Illustration panel */}
        <div className={`relative h-[200px] overflow-hidden bg-gradient-to-br ${gradient}`}>
          {/* decorative soft shapes */}
          <span className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15" />
          <span className="absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-black/10" />
          <span className="absolute right-10 bottom-6 h-12 w-12 rounded-tile bg-white/15 rotate-12" />
          <span className="absolute left-8 top-8 h-3 w-3 rounded-full bg-white/40" />
          <span className="absolute left-16 top-16 h-2 w-2 rounded-full bg-white/30" />

          <div className="absolute inset-0 grid place-items-center">
            <span className="grid h-[88px] w-[88px] place-items-center rounded-full bg-white/18 ring-1 ring-white/30 backdrop-blur-sm">
              <Icon className="h-11 w-11 text-white" strokeWidth={1.6} />
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label={t("tour.skip")}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/15 text-white transition-colors hover:bg-black/25"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">
            {step + 1} / {slides.length} · {t("tour.title")}
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.3px] text-ink">{slide.title}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{slide.desc}</p>

          {/* Dots */}
          <div className="mt-5 flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`${i + 1}`}
                onClick={() => setStep(i)}
                className={
                  i === step
                    ? "h-1.5 w-6 rounded-full bg-brand-violet transition-all"
                    : "h-1.5 w-1.5 rounded-full bg-line-3 transition-all hover:bg-ink-3"
                }
              />
            ))}
          </div>

          {/* Footer */}
          {isLast && finishActions && finishActions.length > 0 ? (
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                {finishActions.map((a, i) => (
                  <FinishButton key={i} action={a} onDone={onClose} />
                ))}
              </div>
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="mt-1 inline-flex items-center justify-center gap-1 text-[12px] font-medium text-ink-3 transition-colors hover:text-ink"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> {t("tour.back")}
                </button>
              )}
            </div>
          ) : (
            <div className="mt-6 flex items-center justify-between gap-3">
              {step > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-tile px-4 py-2.5 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" /> {t("tour.back")}
                </Button>
              ) : (
                <span />
              )}

              {isLast ? (
                <Button
                  variant="dark"
                  onClick={onClose}
                  className="rounded-tile px-5 py-2.5 text-sm"
                >
                  {t("tour.finish")}
                </Button>
              ) : (
                <Button
                  variant="dark"
                  onClick={() => setStep((s) => Math.min(s + 1, last))}
                  className="rounded-tile px-5 py-2.5 text-sm"
                >
                  {t("tour.next")} <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
