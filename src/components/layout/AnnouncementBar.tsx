"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { X, ArrowRight } from "lucide-react";
import { contentService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

const DISMISS_KEY = "skill_dismissed_announcements";

function readDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

// Per-level styling — subtle, matches the design tokens.
const levelClass: Record<string, string> = {
  info: "bg-pill text-ink",
  warning: "bg-[#fdf0d5] text-[#7a4f00]",
  success: "bg-success/12 text-success",
};

/** Site-wide announcements managed in the CMS. Dismissals persist per code (localStorage). */
export function AnnouncementBar() {
  const { locale } = useI18n();
  const [dismissed, setDismissed] = useState<string[]>(readDismissed);

  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements", locale],
    queryFn: () => contentService.getAnnouncements(locale),
    staleTime: 5 * 60_000,
  });

  function dismiss(code: string) {
    const next = [...new Set([...dismissed, code])];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  const visible = announcements.filter((a) => !dismissed.includes(a.code));
  if (visible.length === 0) return null;

  return (
    <div className="pt-safe flex flex-col print:hidden">
      {visible.map((a) => (
        <div
          key={a.code}
          className={cn("flex items-center justify-center gap-3 px-4 py-2 text-[13px] font-medium", levelClass[a.level] ?? levelClass.info)}
        >
          <p className="text-center">
            {a.message}
            {a.ctaHref && a.ctaLabel && (
              <Link href={a.ctaHref} className="ml-2 inline-flex items-center gap-1 font-bold underline underline-offset-2">
                {a.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </p>
          <button
            onClick={() => dismiss(a.code)}
            aria-label="Close"
            className="ml-1 shrink-0 opacity-60 transition-opacity hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
