"use client";

import Link from "next/link";
import { Star, ShieldCheck, Award, MapPin, CalendarX } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useI18n } from "@/i18n/I18nProvider";
import { useContact } from "@/lib/ContactProvider";
import { cn } from "@/lib/cn";
import type { Specialist } from "@/lib/types";

/** Loading placeholder mirroring the specialist card. */
export function SpecialistCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-panel border border-line-3 bg-surface p-4">
      <div className="flex items-start gap-3">
        <Skeleton className={cn("rounded-full", compact ? "h-10 w-10" : "h-12 w-12")} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-2.5 w-2/3" />
        </div>
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      {!compact && <Skeleton className="mt-3 h-7 w-full rounded-tile" />}
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-24 rounded-tile" />
      </div>
    </div>
  );
}

function trustClasses(score: number): string {
  if (score >= 80) return "bg-success-badge text-on-dark";
  if (score >= 73) return "bg-[#7cae2a] text-on-dark";
  return "bg-[#e0a400] text-on-dark";
}

export function TrustBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
        trustClasses(score),
      )}
    >
      <Star className="h-3 w-3 fill-current" />
      {score}
    </span>
  );
}

export function AvailabilityTag({ s }: { s: Specialist }) {
  const { t } = useI18n();
  if (s.availability === "now") {
    return (
      <Tag className="bg-success-chip text-success-chip-text">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        {t("results.cardAvailNow")}
      </Tag>
    );
  }
  if (s.availability === "week") {
    return <Tag className="bg-[#fdf0cf] text-[#8a6400]">{t("results.cardAvailWeek")}</Tag>;
  }
  return <Tag className="bg-pill text-ink-2">{t("results.cardAvailDate", { date: s.availableFrom ?? "" })}</Tag>;
}

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SpecialistCard({
  s,
  compact = false,
  active = false,
  onSelect,
  href,
  unavailableDays = 0,
  rangeDays,
}: {
  s: Specialist;
  compact?: boolean;
  active?: boolean;
  onSelect?: (id: string) => void;
  href?: string;
  /** Days in the requested "when" range this specialist is NOT free (0 = fully available). */
  unavailableDays?: number;
  /** Total days in the requested range — for the "X / Y days" warning. */
  rangeDays?: number | null;
}) {
  const { t } = useI18n();
  const { open } = useContact();
  // Partial-availability warning for the chosen "when" range (we don't hide the specialist).
  const fullyBusy = rangeDays != null && unavailableDays >= rangeDays;
  const className = cn(
    "block rounded-panel border bg-surface p-4 text-left transition-shadow",
    active ? "border-ink shadow-search" : "border-line-3 hover:shadow-sm",
    (onSelect || href) && "cursor-pointer",
  );
  const content = (
    <>
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar name={s.name} index={s.avatarIndex} industry={s.industry} size={compact ? 40 : 48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink">{s.name}</span>
          </div>
          <p className="truncate text-[12px] text-ink-3">{s.role}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {unavailableDays > 0 && (
          <Tag className="bg-[#fdecec] text-[#b42318]">
            <CalendarX className="h-3 w-3" />
            {fullyBusy
              ? t("results.unavailableRange")
              : t("results.partialAvail", { busy: unavailableDays, total: rangeDays ?? 0 })}
          </Tag>
        )}
        <AvailabilityTag s={s} />
        {s.kyc && (
          <Tag className="bg-[#e7efff] text-[#1158ed]">
            <ShieldCheck className="h-3 w-3" />
            {t("results.fKyc").split(" ")[0]}
          </Tag>
        )}
        {s.topRated && (
          <Tag className="bg-success-chip text-success-chip-text">
            <Award className="h-3 w-3" />
            {t("results.topRated")}
          </Tag>
        )}
      </div>

      {/* Location */}
      <p className="mt-2.5 flex items-center gap-1 text-[12px] text-ink-2">
        <MapPin className="h-3.5 w-3.5 text-ink-4" />
        {s.district} · {t("results.km", { km: s.distanceKm })}
      </p>

      {/* Specialties (full only) */}
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {s.specialties.map((sp) => (
            <span
              key={sp.label}
              className="inline-flex items-center gap-1 rounded-tile bg-pill px-2 py-1 text-[11px] text-ink-2"
            >
              {sp.label}
              {sp.count > 0 && <span className="text-ink-4">✓{sp.count}</span>}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div>
          {/* Rate is optional — only show it when the specialist actually set one. */}
          {s.rateFrom > 0 && (
            <span className="text-[15px] font-bold text-ink">
              {t(s.rateType === "monthly" ? "results.perMonth" : "results.perHour", { rate: s.rateFrom })}
            </span>
          )}
          {!compact && s.reviews > 0 && (
            <span className={cn("text-[12px] text-ink-3", s.rateFrom > 0 && "ml-2")}>
              <Star className="mr-0.5 inline h-3 w-3 fill-current text-[#e0a400]" />
              {s.rating.toFixed(1)} ({s.reviews})
            </span>
          )}
        </div>
        <Button
          variant="dark"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            open(s);
          }}
          className="rounded-tile px-3 py-2 text-[12px]"
        >
          {t("results.contact")}
          <span className="font-normal opacity-70">{t("results.tok", { n: s.contactCost })}</span>
        </Button>
      </div>
    </>
  );

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div onClick={onSelect ? () => onSelect(s.id) : undefined} className={className}>
      {content}
    </div>
  );
}
