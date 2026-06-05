"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Star, ChevronRight } from "lucide-react";
import { accountService } from "@/services";
import { Avatar } from "@/components/ui/Avatar";
import { useI18n } from "@/i18n/I18nProvider";

export function ContactsList() {
  const { t } = useI18n();
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: accountService.getContacts,
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("account.contactsTitle")}</h1>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-panel" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="grid min-h-[200px] place-items-center rounded-panel border border-dashed border-line-2 text-center text-sm text-ink-3">
          {t("account.contactsEmpty")}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {contacts.map((c) => (
            <Link
              key={c.id}
              href={`/specialist/${c.id}`}
              className="flex items-center gap-3 rounded-panel border border-line-3 bg-surface p-4 transition-shadow hover:shadow-sm"
            >
              <Avatar name={c.name} index={c.avatarIndex} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-ink">{c.name}</span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-success-badge px-1.5 py-0.5 text-[10px] font-bold text-on-dark">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    {c.trustScore}
                  </span>
                </div>
                <p className="truncate text-[12px] text-ink-3">{c.role}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-2">
                  <MapPin className="h-3 w-3 text-ink-4" />
                  {c.district} · ★ {c.rating.toFixed(1)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-4" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
