"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, MapPin, ArrowUpRight } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { loadRecentSearches } from "@/lib/searchHistory";
import { getCurrentIdToken } from "@/lib/auth-token";
import { landingService } from "@/services";
import type { RecentSearch } from "@/lib/types";

function dedupe(items: RecentSearch[]): RecentSearch[] {
  const seen = new Set<string>();
  const out: RecentSearch[] = [];
  for (const it of items) {
    const key = it.query.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

/**
 * "Recently viewed" quick actions. Sourced from local history (this device, instant) merged with
 * the backend's per-user history (cross-device, when signed in). Renders nothing when empty, so
 * the section never shows up for a brand-new visitor.
 */
export function RecentlyViewed({ serverRecent = [] }: { serverRecent?: RecentSearch[] }) {
  const { t } = useI18n();
  // SSR-safe initial state (no window): whatever the server passed (empty for anonymous).
  const [items, setItems] = useState<RecentSearch[]>(() => dedupe(serverRecent));

  useEffect(() => {
    let active = true;
    (async () => {
      const local = loadRecentSearches();
      let server = serverRecent;
      const token = await getCurrentIdToken();
      if (token) {
        try {
          const landing = await landingService.getLanding();
          server = [...landing.recent, ...serverRecent];
        } catch {
          // keep SSR-provided recent
        }
      }
      if (active) setItems(dedupe([...local, ...server]));
    })();
    return () => {
      active = false;
    };
  }, [serverRecent]);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pb-2 pt-4 sm:px-8 lg:px-24">
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <Clock className="h-4 w-4 text-ink-3" />
        <h2 className="text-[15px] font-semibold text-ink">{t("recent.title")}</h2>
        <span className="text-[12px] text-ink-4">· {t("recent.subtitle")}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((r, i) => (
          <Link
            key={`${r.query}-${i}`}
            href={`/search?q=${encodeURIComponent(r.query)}`}
            className="group inline-flex items-center gap-2 rounded-full border border-line-2 bg-surface px-3.5 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-sm"
          >
            <span className="text-[13px] font-semibold text-ink">{r.query}</span>
            {r.location && (
              <span className="inline-flex items-center gap-1 text-[12px] text-ink-3">
                <MapPin className="h-3 w-3 text-ink-4" />
                {r.location}
                {r.rangeKm ? ` ${t("recent.range", { km: r.rangeKm })}` : ""}
              </span>
            )}
            <ArrowUpRight className="h-3.5 w-3.5 text-ink-4 transition-colors group-hover:text-ink" />
          </Link>
        ))}
      </div>
    </section>
  );
}
