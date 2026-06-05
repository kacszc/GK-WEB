import Link from "next/link";
import { Flame, TrendingUp } from "lucide-react";
import { catalogService, statsService } from "@/services";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";

export async function PopularSection() {
  const { t } = await getI18n();
  const [trending, liveStats] = await Promise.all([
    catalogService.getTrending(),
    statsService.getLiveStats(),
  ]);

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-8 lg:px-24">
      <p className="mb-6 text-sm font-semibold tracking-[1.2px] text-ink-2">
        {t("popular.label")} ·{" "}
        <span className="font-normal text-ink-4">{t("popular.sublabel")}</span>
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-panel border border-line-3 bg-surface">
          <div className="flex items-center gap-2 px-6 py-4">
            <Flame className="h-4 w-4 text-success" />
            <span className="text-[15px] font-semibold text-ink">
              {t("popular.trendingTitle")}
            </span>
            <span className="ml-auto text-[13px] text-ink-4">{t("popular.last24h")}</span>
          </div>
          <ul>
            {trending.map((row, i) => (
              <li key={row.rank} className={cn(i < trending.length - 1 && "border-b border-line-soft")}>
                <Link
                  href={`/search?q=${encodeURIComponent(row.label)}`}
                  className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted"
                >
                  <span className="w-6 text-sm font-bold text-ink-4">{row.rank}</span>
                  <span className="flex-1 text-sm font-medium text-ink">{row.label}</span>
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-success">
                    <TrendingUp className="h-3 w-3" />
                    {row.delta}%
                  </span>
                  <span className="w-12 text-right text-xs text-ink-4">+{row.added}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-panel bg-ink">
          <div className="flex items-center gap-2 px-6 py-4">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
            <span className="text-[15px] font-semibold text-on-dark">
              {t("popular.liveTitle")}
            </span>
            <span className="ml-auto text-[13px] text-ink-4">{t("popular.live")}</span>
          </div>
          <ul>
            {liveStats.map((s, i) => (
              <li
                key={s.desc}
                className={cn(
                  "flex items-baseline gap-3 px-6 py-4",
                  i < liveStats.length - 1 && "border-b border-line-dark",
                )}
              >
                <span
                  className={cn(
                    "text-[32px] font-bold leading-none",
                    s.accent ? "text-success" : "text-on-dark",
                  )}
                >
                  {s.value}
                </span>
                <span className="text-[13px] text-on-dark-3">{s.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
