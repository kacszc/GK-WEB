"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MapPin, Globe, Mail, Star, ShieldCheck, ArrowRight } from "lucide-react";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { employersService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

export function EmployerProfileScreen({ id }: { id: string }) {
  const { t } = useI18n();
  const { data: e, isLoading } = useQuery({
    queryKey: ["employer", id],
    queryFn: () => employersService.getProfile(id),
  });

  if (isLoading || !e) {
    return (
      <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 py-10 sm:px-8">
        <div className="skeleton h-40 rounded-panel" />
        <div className="mt-6 skeleton h-96 rounded-panel" />
      </main>
    );
  }

  return (
    <main className="flex-1">
      {/* Hero */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-6 px-4 py-8 sm:px-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-soft bg-danger text-2xl font-bold text-on-dark">
              {e.initial}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{e.name}</h1>
                {e.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e7efff] px-2 py-0.5 text-[11px] font-semibold text-[#1158ed]">
                    <BadgeCheck className="h-3 w-3" />
                    {t("employer.verified")}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] text-ink-2">{e.industries.join(" · ")}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-3">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-ink-4" />{e.location}</span>
                <span className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-ink-4" />{e.website}</span>
                <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-ink-4" />{e.email}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="bg-[#fff7da] text-[#8a6400]"><Star className="h-3 w-3 fill-current" />{e.rating.toFixed(1)} ocena</Badge>
                <Badge className="bg-success-chip text-success-chip-text">{e.completedJobs} zleceń zrealizowanych</Badge>
                <Badge className="bg-pill text-ink-3">{t("employer.statCompletedSub", { date: e.memberSince })}</Badge>
              </div>
            </div>
          </div>

          {/* Seeking card */}
          <div className="w-full rounded-panel bg-ink p-5 text-on-dark lg:w-[280px] lg:shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-on-dark/60">{t("employer.seeking")}</p>
            <p className="mt-1 text-2xl font-bold">{t("employer.seekingPeople", { n: e.seekingCount })}</p>
            <p className="mt-1 text-[12px] text-on-dark/70">{e.seekingRoles}</p>
            <a href="#jobs" className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-tile bg-surface px-4 py-2.5 text-[13px] font-bold text-ink hover:bg-surface/90">
              {t("employer.seekingCta")}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto grid w-full max-w-[1080px] gap-6 px-4 py-10 sm:px-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {/* About */}
          <Section title={t("employer.about")}>
            <p className="text-[14px] leading-relaxed text-ink-2">{e.description}</p>
          </Section>

          {/* Platform history */}
          <Section title={t("employer.historyTitle")}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat value={String(e.completedJobs)} label={t("employer.statCompleted")} sub={t("employer.statCompletedSub", { date: e.memberSince })} />
              <Stat value={t("employer.days", { n: e.avgHireDays })} label={t("employer.statHireTime")} sub={t("employer.statHireTimeSub")} />
              <Stat value={`${e.onTimePayment}%`} label={t("employer.statPayment")} sub={`${e.completedJobs} z ${e.completedJobs}`} />
            </div>
            <p className="mb-2 mt-5 text-[12px] font-semibold text-ink-3">{t("employer.hiredMost")}</p>
            <div className="flex flex-wrap gap-2">
              {e.hiredRoles.map((r) => (
                <span key={r.role} className="rounded-full border border-line-2 px-3 py-1 text-[12px] text-ink">
                  {r.role} ×{r.count}
                </span>
              ))}
            </div>
          </Section>

          {/* Reverse-trust ratings */}
          <Section title={t("employer.ratingsTitle")}>
            <p className="-mt-1 mb-4 text-[12px] text-ink-3">
              {t("employer.ratingsSub", { n: e.reviews.length, avg: e.rating.toFixed(1), flags: e.flags })}
            </p>
            <div className="flex flex-col gap-2.5">
              {e.ratings.map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="w-56 shrink-0 text-[13px] text-ink-2">{r.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-pill">
                    <div className="h-full rounded-full bg-success" style={{ width: `${(r.score / 5) * 100}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[13px] font-semibold text-ink">{r.score.toFixed(1)}</span>
                </div>
              ))}
            </div>
            {e.flags === 0 && (
              <div className="mt-4 flex items-start gap-2 rounded-tile bg-success-chip/50 px-3.5 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success-chip-text" />
                <div>
                  <p className="text-[13px] font-semibold text-success-chip-text">{t("employer.noFlags")}</p>
                  <p className="text-[12px] text-ink-2">{t("employer.noFlagsSub")}</p>
                </div>
              </div>
            )}
          </Section>

          {/* Two-sided reviews (worker → employer): summary + sort + per-review categories/flags. */}
          <ReviewsSection subjectId={id} subjectKind="employer" />
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-6" id="jobs">
          <Section title={t("employer.activeJobsTitle", { n: e.activeJobs.length })}>
            <div className="flex flex-col gap-3">
              {e.activeJobs.map((j) => (
                <div key={j.id} className="rounded-tile border border-line-3 p-3">
                  <p className="text-[14px] font-semibold text-ink">{j.title}</p>
                  <p className="mt-0.5 text-[12px] text-ink-3">{j.meta}</p>
                  <Link href="/jobs" className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-violet hover:underline">
                    {t("employer.applyJob")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </Section>
          <Section title={t("employer.eventsTitle")}>
            <div className="grid grid-cols-2 gap-2">
              {e.eventColors.map((c, i) => (
                <div key={i} className="aspect-square rounded-tile" style={{ background: c }} />
              ))}
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold", className)}>{children}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-panel border border-line-3 bg-surface p-6">
      <h2 className="mb-3 text-[15px] font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="rounded-tile border border-line-3 p-3.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-ink-4">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      <p className="text-[11px] text-ink-4">{sub}</p>
    </div>
  );
}

