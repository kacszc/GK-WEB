"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { messagesService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/AuthProvider";
import { cn } from "@/lib/cn";

/** Header shortcut to the inbox with an unread badge. Polls while signed in; 0 when backend is down. */
export function MessagesBell() {
  const { t } = useI18n();
  const { user } = useAuth();

  const { data: unread = 0 } = useQuery({
    queryKey: ["conversations", "unread-count"],
    queryFn: async () => (await messagesService.getThreads()).reduce((n, c) => n + c.unread, 0),
    enabled: !!user,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  return (
    <Link
      href="/account/messages"
      aria-label={t("account.navMessages")}
      className={cn(
        "relative grid h-9 w-9 place-items-center rounded-full border border-line-2 text-ink-2 transition-colors hover:bg-muted",
      )}
    >
      <MessageSquare className="h-4 w-4" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-on-dark ring-2 ring-surface">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
