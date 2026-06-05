import Link from "next/link";
import { Search, MapPinned, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";

type CardTheme = "light" | "gradient" | "dark";

export async function ActionCards() {
  const { t } = await getI18n();

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-8">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-[22px] font-bold tracking-[-0.5px] text-ink">
          {t("actions.heading")}
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-chip px-3 py-1 text-[11px] font-semibold tracking-[0.5px] text-success-chip-text">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
          {t("actions.liveBadge", { count: 247 })}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ActionCard
          theme="light"
          href="/search"
          icon={<Search className="h-7 w-7 text-ink" />}
          title={t("actions.searchTitle")}
          desc={t("actions.searchDesc")}
          cta={t("actions.searchCta")}
        />
        <ActionCard
          theme="gradient"
          href="/search?view=map"
          icon={<MapPinned className="h-7 w-7 text-on-dark" />}
          title={t("actions.mapTitle")}
          desc={t("actions.mapDesc")}
          cta={t("actions.mapCta")}
        />
        <ActionCard
          theme="dark"
          href="/post-job"
          icon={<Plus className="h-7 w-7 text-on-dark" />}
          title={t("actions.jobTitle")}
          desc={t("actions.jobDesc")}
          cta={t("actions.jobCta")}
        />
      </div>
    </section>
  );
}

function ActionCard({
  theme,
  icon,
  title,
  desc,
  cta,
  href,
}: {
  theme: CardTheme;
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  href?: string;
}) {
  const container = cn(
    "flex flex-col gap-5 rounded-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
    theme === "light" && "border border-line bg-surface",
    theme === "gradient" && "bg-map-card",
    theme === "dark" && "bg-ink",
  );
  const titleColor = theme === "light" ? "text-ink" : "text-on-dark";
  const descColor = theme === "light" ? "text-ink-2" : "text-on-dark-2";
  const iconTile = cn(
    "grid h-12 w-12 place-items-center rounded-tile",
    theme === "light" ? "bg-pill" : "bg-white/16",
  );

  return (
    <div className={container}>
      <span className={iconTile}>{icon}</span>
      <div className="space-y-2">
        <h3 className={cn("text-[22px] font-bold leading-[1.2] tracking-[-0.5px]", titleColor)}>
          {title}
        </h3>
        <p className={cn("text-[13px] leading-[1.5]", descColor)}>{desc}</p>
      </div>
      {href ? (
        <Link
          href={href}
          className={cn(
            "mt-auto inline-flex w-full items-center justify-center gap-2 rounded-cta px-4 py-3 text-[13px] font-bold transition-colors",
            theme === "light" ? "bg-ink text-on-dark hover:bg-ink/90" : "bg-surface text-ink hover:bg-surface/90",
          )}
        >
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <Button
          variant={theme === "light" ? "dark" : "white"}
          className="mt-auto w-full rounded-cta px-4 py-3 text-[13px]"
        >
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
