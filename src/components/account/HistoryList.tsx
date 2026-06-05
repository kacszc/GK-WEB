"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, MessageSquare, UserCheck, Send, Star } from "lucide-react";
import { accountService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import type { ActivityType } from "@/lib/types";

const icons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  job_posted: Plus,
  contacted: MessageSquare,
  hired: UserCheck,
  applied: Send,
  review: Star,
};

export function HistoryList() {
  const { t } = useI18n();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: accountService.getActivity,
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("account.historyTitle")}</h1>

      {isLoading ? (
        <div className="skeleton h-64 rounded-panel" />
      ) : items.length === 0 ? (
        <div className="grid min-h-[200px] place-items-center rounded-panel border border-dashed border-line-2 text-center text-sm text-ink-3">
          {t("account.historyEmpty")}
        </div>
      ) : (
        <ol className="rounded-panel border border-line-3 bg-surface p-2">
          {items.map((it, i) => {
            const Icon = icons[it.type];
            return (
              <li
                key={it.id}
                className={`flex items-start gap-3 px-3 py-3 ${i > 0 ? "border-t border-line" : ""}`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pill text-ink-2">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-ink">{it.text}</p>
                  <p className="text-[11px] text-ink-4">{it.time}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
