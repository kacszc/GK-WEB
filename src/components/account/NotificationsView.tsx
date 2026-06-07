"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BellOff, CheckCheck } from "lucide-react";
import { notificationsService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { Notification } from "@/lib/types";

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

/** Full-page notification inbox (linked from the header bell's "see all"). */
export function NotificationsView() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => notificationsService.list(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onMutate: async (id) => {
      queryClient.setQueryData<Notification[]>(["notifications", "list"], (prev) =>
        prev?.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
    onSettled: invalidate,
  });

  const markAll = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onMutate: async () => {
      queryClient.setQueryData<Notification[]>(["notifications", "list"], (prev) =>
        prev?.map((n) => ({ ...n, read: true })),
      );
    },
    onSettled: invalidate,
  });

  function open(n: Notification) {
    if (!n.read) markRead.mutate(n.id);
    if (n.link) router.push(n.link);
  }

  const hasUnread = items.some((n) => !n.read);

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
      ) : items.length === 0 ? (
        <div className="grid min-h-[220px] place-items-center gap-2 rounded-panel border border-dashed border-line-2 text-center">
          <BellOff className="h-7 w-7 text-ink-4" />
          <p className="text-sm text-ink-3">{t("notifications.empty")}</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
