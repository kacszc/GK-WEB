"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { accountService } from "@/services";
import { Avatar } from "@/components/ui/Avatar";
import { useI18n } from "@/i18n/I18nProvider";

export function MessagesList() {
  const { t } = useI18n();
  const { data: convos = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: accountService.getConversations,
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("account.messagesTitle")}</h1>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-panel" />
          ))}
        </div>
      ) : convos.length === 0 ? (
        <Empty>{t("account.messagesEmpty")}</Empty>
      ) : (
        <div className="overflow-hidden rounded-panel border border-line-3 bg-surface">
          {convos.map((c, i) => (
            <Link
              key={c.id}
              href={`/account/messages/${c.id}`}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <Avatar name={c.name} index={c.avatarIndex} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-ink">{c.name}</span>
                  <span className="shrink-0 text-[11px] text-ink-4">{c.time}</span>
                </div>
                <p className={`truncate text-[13px] ${c.unread ? "font-medium text-ink" : "text-ink-3"}`}>
                  {c.lastMessage}
                </p>
              </div>
              {c.unread > 0 && (
                <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand-violet px-1 text-[11px] font-bold text-white">
                  {c.unread}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[200px] place-items-center rounded-panel border border-dashed border-line-2 text-center text-sm text-ink-3">
      {children}
    </div>
  );
}
