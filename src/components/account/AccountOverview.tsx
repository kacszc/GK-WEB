"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MessageSquare, Coins, Plus, Search, Compass, Send } from "lucide-react";
import { accountService, messagesService, applicationsService } from "@/services";
import { PromoteProfile } from "./PromoteProfile";
import { ProfileChecklist } from "./ProfileChecklist";
import { SpecialistOfferStatus } from "./SpecialistOfferStatus";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/AuthProvider";
import { useWallet } from "@/lib/WalletProvider";
import { useTour } from "@/lib/TourProvider";
import { useI18n } from "@/i18n/I18nProvider";
import type { UserRole } from "@/lib/types";

export function AccountOverview() {
  const { t } = useI18n();
  const { user, ready: authReady } = useAuth();
  const { balance, ready: walletReady } = useWallet();
  const { open: openTour } = useTour();
  const role: UserRole = user?.role === "employer" ? "employer" : "specialist";
  const isEmployer = role === "employer";

  // Jobs are employer-only; applications are specialist-only — fetch only what the role uses.
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["myJobs"],
    queryFn: accountService.getMyJobs,
    enabled: authReady && isEmployer,
  });
  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["myApplications"],
    queryFn: () => applicationsService.getMine(),
    enabled: authReady && !isEmployer,
  });
  const { data: convos = [], isLoading: convosLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: messagesService.getThreads,
  });

  // Show a skeleton until auth/wallet are restored and the stat data arrives,
  // so the greeting and stat values don't flash empty/default values.
  if (!authReady || !walletReady || jobsLoading || appsLoading || convosLoading) {
    return <OverviewSkeleton />;
  }

  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const unread = convos.reduce((n, c) => n + c.unread, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">
            {t("account.greeting", { name: user?.name ?? "" })}
          </h1>
          <p className="mt-1 text-[13px] text-ink-3">{t("account.overviewSubtitle")}</p>
        </div>
        <button
          onClick={openTour}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-tile border border-line-3 bg-surface px-3 py-2 text-[13px] font-semibold text-ink transition-shadow hover:shadow-sm"
        >
          <Compass className="h-4 w-4 text-brand-violet" />
          {t("tour.reopen")}
        </button>
      </div>

      {isEmployer ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat icon={<Briefcase className="h-4 w-4" />} value={activeJobs} label={t("account.statActiveJobs")} href="/account/jobs" />
            <Stat icon={<MessageSquare className="h-4 w-4" />} value={unread} label={t("account.statMessages")} href="/account/messages" />
            <Stat icon={<Coins className="h-4 w-4 text-[#e0a400]" />} value={balance} label={t("account.statTokens")} href="/account/tokens" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Quick href="/post-job" icon={<Plus className="h-5 w-5" />} label={t("account.quickPost")} dark />
            <Quick href="/search" icon={<Search className="h-5 w-5" />} label={t("account.quickSearch")} />
          </div>
        </>
      ) : (
        <>
          {/* Offer visibility — publish/hide/finish the specialist's listing (draft by default). */}
          <SpecialistOfferStatus />
          {/* Progressive profiling: what was skipped in the wizard gets finished here. */}
          <ProfileChecklist />
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat icon={<Send className="h-4 w-4" />} value={applications.length} label={t("account.statApplications")} href="/account/applications" />
            <Stat icon={<MessageSquare className="h-4 w-4" />} value={unread} label={t("account.statMessages")} href="/account/messages" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <PromoteProfile />
            <Quick href="/jobs" icon={<Search className="h-5 w-5" />} label={t("nav.findWork")} />
          </div>
        </>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-tile" />
        <Skeleton className="h-3.5 w-48" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="h-[104px] border border-line-3" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonCard key={i} className="h-[76px] border border-line-3" />
        ))}
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  href,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-panel border border-line-3 bg-surface p-5 transition-shadow hover:shadow-sm">
      <span className="text-ink-3">{icon}</span>
      <div className="mt-2 text-2xl font-bold text-ink">{value}</div>
      <div className="text-[12px] text-ink-3">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Quick({
  href,
  icon,
  label,
  dark,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        dark
          ? "flex items-center gap-3 rounded-panel bg-ink p-5 text-on-dark transition-colors hover:bg-ink/90"
          : "flex items-center gap-3 rounded-panel border border-line-3 bg-surface p-5 text-ink transition-shadow hover:shadow-sm"
      }
    >
      <span className={dark ? "grid h-10 w-10 place-items-center rounded-tile bg-white/16" : "grid h-10 w-10 place-items-center rounded-tile bg-pill"}>
        {icon}
      </span>
      <span className="text-[15px] font-semibold">{label}</span>
    </Link>
  );
}
