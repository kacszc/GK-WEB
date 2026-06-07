"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  Award,
  MapPin,
  Clock,
  Briefcase,
  CalendarCheck,
  Repeat,
  Globe,
  Share2,
  Bookmark,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SearchTopbar } from "@/components/search/SearchTopbar";
import { TrustBadge, AvailabilityTag } from "@/components/search/SpecialistCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSpecialist } from "@/hooks/useSpecialist";
import { useI18n } from "@/i18n/I18nProvider";
import { useContact } from "@/lib/ContactProvider";
import { reviewsService, portfolioService } from "@/services";
import { cn } from "@/lib/cn";
import type { SpecialistProfile, Review, PortfolioItem } from "@/lib/types";

const LANG_KEY: Record<string, string> = {
  pl: "results.langPl",
  en: "results.langEn",
  uk: "results.langUk",
  de: "results.langDe",
  ru: "results.langRu",
};

export function SpecialistProfileScreen({ id }: { id: string }) {
  const { t } = useI18n();
  const { data, isLoading } = useSpecialist(id);

  return (
    <>
      <SearchTopbar category={data?.name ?? "—"} />

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pt-6 pb-20 sm:px-8">
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-ink-2 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("profile.back")}
        </Link>

        {isLoading ? (
          <ProfileSkeleton />
        ) : !data ? (
          <NotFound t={t} />
        ) : (
          <Profile s={data} t={t} />
        )}
      </main>
    </>
  );
}

function Profile({ s, t }: { s: SpecialistProfile; t: (k: string, p?: Record<string, string | number>) => string }) {
  const { open } = useContact();
  // Prefer real backend reviews when available; otherwise fall back to the
  // profile's bundled (mock) review list.
  const { data: backendReviews = [] } = useQuery({
    queryKey: ["reviews", s.id],
    queryFn: () => reviewsService.listForSubject(s.id),
  });
  const reviews: Review[] = backendReviews.length > 0 ? backendReviews : s.reviewList;
  // Public portfolio (empty when none / backend down → section hidden).
  const { data: portfolio = [] } = useQuery({
    queryKey: ["portfolio", "public", s.id],
    queryFn: () => portfolioService.getPublicPortfolio(s.id),
  });
  return (
    <>
      {/* Header card */}
      <div className="flex flex-col gap-5 rounded-panel border border-line-3 bg-surface p-6 sm:flex-row sm:items-start">
        <Avatar name={s.name} index={s.avatarIndex} size={84} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{s.name}</h1>
            <TrustBadge score={s.trustScore} />
          </div>
          <p className="mt-0.5 text-sm text-ink-2">{s.role}</p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <AvailabilityTag s={s} />
            {s.kyc && (
              <Tag className="bg-[#e7efff] text-[#1158ed]">
                <ShieldCheck className="h-3 w-3" />
                KYC
              </Tag>
            )}
            {s.topRated && (
              <Tag className="bg-success-chip text-success-chip-text">
                <Award className="h-3 w-3" />
                {t("results.topRated")}
              </Tag>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-2">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-ink-4" />
              {s.district} · {t("results.km", { km: s.distanceKm })}
            </span>
            {s.reviews > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-current text-[#e0a400]" />
                {s.rating.toFixed(1)} ({s.reviews})
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-ink-4" />
              {s.languages.map((l) => t(LANG_KEY[l] ?? l)).join(", ")}
            </span>
          </div>
        </div>

        <div className="flex gap-2 sm:flex-col">
          <Button
            variant="dark"
            onClick={() => open(s)}
            className="rounded-tile px-4 py-2.5 text-[13px]"
          >
            {t("results.contact")}
            <span className="font-normal opacity-70">{t("results.tok", { n: 3 })}</span>
          </Button>
          <button className="grid h-10 w-10 place-items-center rounded-tile border border-line-2 text-ink-2 hover:bg-muted">
            <Bookmark className="h-4 w-4" />
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-tile border border-line-2 text-ink-2 hover:bg-muted">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Section title={t("profile.about")}>
            <p className="text-sm leading-relaxed text-ink-2">{s.bio}</p>
          </Section>

          <Section title={t("profile.specializations")}>
            <div className="flex flex-wrap gap-2">
              {s.specialties.map((sp) => (
                <span
                  key={sp.label}
                  className="inline-flex items-center gap-1 rounded-tile bg-pill px-2.5 py-1.5 text-[12px] text-ink-2"
                >
                  {sp.label}
                  {sp.count > 0 && <span className="text-ink-4">✓{sp.count}</span>}
                </span>
              ))}
            </div>
          </Section>

          <Section title={t("profile.stats")}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon={<Briefcase className="h-4 w-4" />} value={String(s.completedJobs)} label={t("profile.completedJobs")} />
              <Stat icon={<Clock className="h-4 w-4" />} value={t("profile.responseValue", { min: s.responseTimeMin })} label={t("profile.responseTime")} />
              <Stat icon={<Repeat className="h-4 w-4" />} value={`${s.repeatClientsPct}%`} label={t("profile.repeatClients")} />
              <Stat icon={<CalendarCheck className="h-4 w-4" />} value={s.memberSince} label={t("profile.memberSince", { year: s.memberSince })} />
            </div>
          </Section>

          <Section title={t("profile.verification")}>
            <div className="flex flex-wrap gap-2">
              {s.kyc && (
                <Tag className="bg-[#e7efff] text-[#1158ed]">
                  <ShieldCheck className="h-3 w-3" />
                  {t("results.fKyc")}
                </Tag>
              )}
              {s.certifications.map((c) => (
                <Tag key={c} className="bg-pill text-ink-2">
                  {c}
                </Tag>
              ))}
            </div>
          </Section>

          {portfolio.length > 0 && (
            <Section title={t("profile.portfolio")}>
              <div className="grid gap-4 sm:grid-cols-2">
                {portfolio.map((it) => (
                  <ProfilePortfolioCard key={it.id} item={it} verifiedLabel={t("portfolio.verified")} selfLabel={t("portfolio.selfAdded")} />
                ))}
              </div>
            </Section>
          )}

          <Section title={`${t("profile.reviews")} · ${t("profile.reviewsCount", { count: s.reviews })}`}>
            <div className="flex flex-col gap-3">
              {reviews.map((r, i) => (
                <div key={i} className="rounded-tile border border-line-3 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">{r.author}</span>
                    <span className="inline-flex items-center gap-1 text-[12px] text-ink-2">
                      <Star className="h-3.5 w-3.5 fill-current text-[#e0a400]" />
                      {r.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{r.text}</p>
                  <p className="mt-2 text-[11px] text-ink-4">{r.date}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Contact sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-panel border border-line-3 bg-surface p-5">
            <p className="text-[13px] text-ink-3">{t("profile.fromRate", { rate: s.rateFrom })}</p>
            <Button
              variant="gradient"
              onClick={() => open(s)}
              className="mt-3 w-full rounded-tile py-3 text-sm"
            >
              {t("results.contact")}
              <span className="font-normal opacity-80">{t("results.tok", { n: 3 })}</span>
            </Button>
            <p className="mt-2 text-center text-[12px] text-ink-3">
              {t("profile.contactNote", { min: s.responseTimeMin })}
            </p>

            <hr className="my-4 border-line" />

            <Row label={t("profile.availability")}>
              <AvailabilityTag s={s} />
            </Row>
            <Row label={t("profile.location")}>
              <span className="text-[13px] font-medium text-ink">
                {s.district} · {t("results.km", { km: s.distanceKm })}
              </span>
            </Row>
            <Row label={t("profile.languages")}>
              <span className="text-[13px] font-medium text-ink">
                {s.languages.map((l) => t(LANG_KEY[l] ?? l)).join(", ")}
              </span>
            </Row>
          </div>
        </aside>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-panel border border-line-3 bg-surface p-6">
      <h2 className="mb-3 text-[15px] font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-tile bg-subtle p-3">
      <span className="text-ink-3">{icon}</span>
      <div className="mt-1.5 text-lg font-bold text-ink">{value}</div>
      <div className="text-[11px] leading-tight text-ink-3">{label}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[12px] text-ink-3">{label}</span>
      {children}
    </div>
  );
}

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${className ?? ""}`}>
      {children}
    </span>
  );
}

function ProfilePortfolioCard({ item, verifiedLabel, selfLabel }: { item: PortfolioItem; verifiedLabel: string; selfLabel: string }) {
  const verified = item.status === "verified";
  return (
    <div className={cn("overflow-hidden rounded-tile border bg-surface", verified ? "border-success-badge" : "border-line-3")}>
      <div className="flex h-28 gap-0.5">
        {item.colors.slice(0, 3).map((c, i) => (
          <div key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-ink">{item.title}</h3>
          {verified ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-chip px-2 py-0.5 text-[10px] font-semibold text-success-chip-text">
              <ShieldCheck className="h-3 w-3" />
              {verifiedLabel}
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center rounded-full bg-pill px-2 py-0.5 text-[10px] font-semibold text-ink-3">
              {selfLabel}
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-[12px] text-ink-2">{item.description}</p>
        <p className="mt-1 text-[11px] text-ink-4">
          {[item.location, item.date].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );
}

function NotFound({ t }: { t: (k: string) => string }) {
  return (
    <div className="grid min-h-[300px] place-items-center text-center">
      <div>
        <p className="text-sm font-semibold text-ink">{t("profile.notFound")}</p>
        <p className="mt-1 text-[13px] text-ink-3">{t("profile.notFoundHint")}</p>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-5 rounded-panel border border-line-3 bg-surface p-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-panel" />
          <Skeleton className="h-32 w-full rounded-panel" />
        </div>
        <Skeleton className="h-60 w-full rounded-panel" />
      </div>
    </div>
  );
}
