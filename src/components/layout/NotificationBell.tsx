"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Bell, BellOff, CheckCheck, Loader2 } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { notificationsService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/AuthProvider";
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

export function NotificationBell() {
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Derive the badge from the SAME list the inbox shows (shared cache) so the count can never
  // diverge from what the user can actually see/clear — an empty inbox always means a 0 badge.
  const { data: items = [] } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => notificationsService.list(),
    enabled: !!user,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const unread = items.filter((n) => !n.read).length;

  return (
    <Popover
      align="end"
      panelClassName="w-80 max-w-[calc(100vw-2rem)] p-0"
      trigger={({ open }) => (
        <span
          aria-label={t("notifications.title")}
          className={cn(
            "relative grid h-9 w-9 place-items-center rounded-full border border-line-2 text-ink-2 transition-colors",
            open ? "bg-muted" : "hover:bg-muted",
          )}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-on-dark ring-2 ring-surface">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
      )}
    >
      {({ close }) => (
        <NotificationInbox
          close={close}
          onChange={() => queryClient.invalidateQueries({ queryKey: ["notifications"] })}
        />
      )}
    </Popover>
  );
}

function NotificationInbox({ close, onChange }: { close: () => void; onChange: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => notificationsService.list(),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onMutate: async (id) => {
      // Optimistically mark the item read in the cached list.
      queryClient.setQueryData<Notification[]>(["notifications", "list"], (prev) =>
        prev?.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
    onSettled: onChange,
  });

  const markAll = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onMutate: async () => {
      queryClient.setQueryData<Notification[]>(["notifications", "list"], (prev) =>
        prev?.map((n) => ({ ...n, read: true })),
      );
    },
    onSettled: onChange,
  });

  const hasUnread = items.some((n) => !n.read);

  // Mark read on open, then navigate to the notification's target (if any) and close the popover.
  function open(n: Notification) {
    if (!n.read) markRead.mutate(n.id);
    if (n.link) {
      close();
      router.push(n.link);
    }
  }

  return (
    <div className="flex max-h-[26rem] flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-ink">{t("notifications.title")}</p>
        {hasUnread && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-2 hover:text-ink"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {t("notifications.markAll")}
          </button>
        )}
      </div>

      <div className="overflow-y-auto">
        {isLoading ? (
          <div className="grid place-items-center py-10 text-ink-3">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="grid place-items-center gap-2 px-4 py-10 text-center">
            <BellOff className="h-6 w-6 text-ink-4" />
            <p className="text-[13px] text-ink-3">{t("notifications.empty")}</p>
          </div>
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              onClick={() => open(n)}
              className={cn(
                "group flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted",
                !n.read && "bg-[#f6f3ff]",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 self-start rounded-full",
                  n.read ? "bg-transparent" : "bg-brand-violet",
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink">{n.title}</span>
                {n.body && <span className="mt-0.5 block text-[12px] leading-snug text-ink-2">{n.body}</span>}
                <span className="mt-1 block text-[11px] text-ink-4">{timeAgo(n.createdAt, t)}</span>
              </span>
              {n.link && (
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-4 transition-colors group-hover:text-ink-2" />
              )}
            </button>
          ))
        )}
      </div>

      {items.length > 0 && (
        <Link
          href="/account/notifications"
          onClick={close}
          className="border-t border-line px-4 py-2.5 text-center text-[12px] font-medium text-brand-violet hover:bg-muted"
        >
          {t("notifications.seeAll")}
        </Link>
      )}
    </div>
  );
}
