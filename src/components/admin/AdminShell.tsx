"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/lib/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { adminService } from "@/services";

/** Gates the whole CMS: signed in + present in the admins table (server-checked via /api/admin/me). */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["amIAdmin"],
    queryFn: adminService.amIAdmin,
    enabled: ready && !!user,
    staleTime: 5 * 60_000,
  });

  if (!ready || (user && isLoading)) {
    return (
      <main className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 pt-6 pb-20 sm:px-8 lg:grid-cols-[220px_1fr]">
        <nav className="hidden lg:flex lg:flex-col lg:gap-0.5" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-tile" />
          ))}
        </nav>
        <SkeletonCard className="h-64 border border-line-3" />
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="mx-auto grid min-h-[60vh] w-full max-w-[1280px] place-items-center px-4 text-center">
        <div>
          <ShieldAlert className="mx-auto h-10 w-10 text-ink-4" />
          <p className="mt-3 text-sm font-semibold text-ink">{t("admin.notAuthorized")}</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-on-dark hover:bg-ink/90"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("admin.backHome")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Logo />
            </Link>
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.5px] text-on-dark">
              CMS
            </span>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            {t("admin.backToSite")}
          </Link>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 pt-6 pb-20 sm:px-8 lg:grid-cols-[220px_1fr]">
        <AdminSidebar />
        <div>{children}</div>
      </main>
    </>
  );
}
