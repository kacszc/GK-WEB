"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ArrowRight, BellOff, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { notificationsService } from "@/services";
import type { NotificationPage } from "@/services/notifications.service";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { Notification } from "@/lib/types";

const PAGE_SIZE = 10;

/** Relative time label from an ISO timestamp. */
function timeAgo(iso: string, t: (k: string, p?: Record<string, string | number>) => string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (mins < 1) return t("notifications.now");
  if (mins < 60) return t("notifications.minsAgo", { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("notifications.hoursAgo", { n: hours });
  const days = Math.floor(hours / 24);
  return t("notifications.daysAgo", { n: days });
}

/** Full-page notification inbox — server-paginated (newest first). */
export function NotificationsView() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "page", page],
    queryFn: () => notificationsService.listPage(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasUnread = (data?.unread ?? 0) > 0;

  // Refresh every notifications query (this page, other pages, and the header bell's full list).
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onMutate: async (id) => {
      queryClient.setQueryData<NotificationPage>(["notifications", "page", page], (prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
              unread: Math.max(0, prev.unread - 1),
            }
          : prev,
      );
    },
    onSettled: invalidate,
  });

  const markAll = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onMutate: async () => {
      queryClient.setQueryData<NotificationPage>(["notifications", "page", page], (prev) =>
        prev ? { ...prev, items: prev.items.map((n) => ({ ...n, read: true })), unread: 0 } : prev,
      );
    },
    onSettled: invalidate,
  });

  function open(n: Notification) {
    if (!n.read) markRead.mutate(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("notifications.pageTitle")}</h1>
          <p className="mt-1 text-sm text-ink-3">{t("notifications.pageSubtitle")}</p>
        </div>
        {hasUnread && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-tile border border-line-2 px-3 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:bg-muted"
          >
            <CheckCheck className="h-4 w-4" />
            {t("notifications.markAll")}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-panel" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="grid min-h-[220px] place-items-center gap-2 rounded-panel border border-dashed border-line-2 text-center">
          <BellOff className="h-7 w-7 text-ink-4" />
          <p className="text-sm text-ink-3">{t("notifications.empty")}</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-panel border border-line-3 bg-surface">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={cn(
                  "group flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-muted",
                  !n.read && "bg-[#f6f3ff]",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 self-start rounded-full mt-1.5",
                    n.read ? "bg-transparent" : "bg-brand-violet",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{n.title}</span>
                  {n.body && <span className="mt-0.5 block text-[13px] leading-snug text-ink-2">{n.body}</span>}
                  <span className="mt-1 block text-[11px] text-ink-4">{timeAgo(n.createdAt, t)}</span>
                </span>
                {n.link && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-4 transition-colors group-hover:text-ink-2" />
                )}
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 rounded-tile border border-line-2 px-3 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("notifications.prev")}
              </button>
              <span className="text-[12px] text-ink-3">
                {t("notifications.pageOf", { n: page + 1, total: totalPages })}
              </span>
              <button
                onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                disabled={page + 1 >= totalPages}
                className="inline-flex items-center gap-1 rounded-tile border border-line-2 px-3 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:bg-muted disabled:opacity-40"
              >
                {t("notifications.next")}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
