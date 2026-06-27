"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Pencil, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { accountService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/lib/ToastProvider";

const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-tile border border-line-4 bg-surface px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-muted";

/**
 * Specialist offer visibility card on /account. A profile is a DRAFT until the specialist publishes
 * it — only published offers appear in /search. Three states: incomplete → finish; hidden → publish;
 * published → hide. Editing re-runs onboarding (idempotent upsert).
 */
export function SpecialistOfferStatus() {
  const { t } = useI18n();
  const { show } = useToast();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["mySpecialistProfile"],
    queryFn: () => accountService.getMySpecialistProfile(),
  });

  const publish = useMutation({
    mutationFn: () => accountService.publishMyProfile(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mySpecialistProfile"] });
      show({ title: t("offer.publishedToast") });
    },
    onError: () => show({ title: t("offer.error") }),
  });
  const unpublish = useMutation({
    mutationFn: () => accountService.unpublishMyProfile(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mySpecialistProfile"] });
      show({ title: t("offer.hiddenToast") });
    },
    onError: () => show({ title: t("offer.error") }),
  });

  if (isLoading) return <SkeletonCard className="h-[96px] border border-line-3" />;

  const pending = publish.isPending || unpublish.isPending;
  // No profile yet (skipped onboarding) or missing required data → must finish first.
  const incomplete = !profile || !profile.complete;
  const published = !!profile?.published;

  if (incomplete) {
    return (
      <Shell tone="amber" icon={<AlertCircle className="h-5 w-5" />} title={t("offer.incompleteTitle")} desc={t("offer.incompleteDesc")}>
        <Link href="/onboarding/specialist?resume=1" className="inline-flex items-center justify-center gap-2 rounded-tile bg-ink px-4 py-2.5 text-sm font-bold text-on-dark transition-colors hover:bg-ink/90">
          {t("offer.complete")}
        </Link>
      </Shell>
    );
  }

  if (published) {
    return (
      <Shell tone="green" icon={<Eye className="h-5 w-5" />} title={t("offer.publishedTitle")} desc={t("offer.publishedDesc")}>
        <Link href="/onboarding/specialist?resume=1" className={btnOutline}>
          <Pencil className="h-4 w-4" /> {t("offer.edit")}
        </Link>
        <Button variant="outline" className="rounded-tile px-4 py-2.5 text-sm" onClick={() => unpublish.mutate()} disabled={pending}>
          {unpublish.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><EyeOff className="h-4 w-4" /> {t("offer.unpublish")}</>}
        </Button>
      </Shell>
    );
  }

  // Complete but hidden (draft) → publish.
  return (
    <Shell tone="neutral" icon={<EyeOff className="h-5 w-5" />} title={t("offer.hiddenTitle")} desc={t("offer.hiddenDesc")}>
      <Link href="/onboarding/specialist?resume=1" className={btnOutline}>
        <Pencil className="h-4 w-4" /> {t("offer.edit")}
      </Link>
      <Button variant="dark" className="rounded-tile px-4 py-2.5 text-sm" onClick={() => publish.mutate()} disabled={pending}>
        {publish.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Eye className="h-4 w-4" /> {t("offer.publish")}</>}
      </Button>
    </Shell>
  );
}

const tones = {
  green: "border-success/30 bg-success/8 text-success",
  amber: "border-[#e0a400]/30 bg-[#fff8e6] text-[#a06a00]",
  neutral: "border-line-3 bg-muted text-ink-2",
} as const;

function Shell({
  tone,
  icon,
  title,
  desc,
  children,
}: {
  tone: keyof typeof tones;
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-panel border border-line-3 bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-tile border ${tones[tone]}`}>{icon}</span>
        <div>
          <p className="text-[15px] font-semibold text-ink">{title}</p>
          <p className="mt-0.5 text-[13px] text-ink-3">{desc}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">{children}</div>
    </div>
  );
}
