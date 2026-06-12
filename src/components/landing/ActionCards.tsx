import { Search, MapPinned } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { ActionCard } from "./ActionCard";
import { PrimaryActionCard } from "./PrimaryActionCard";

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
        <PrimaryActionCard />
      </div>
    </section>
  );
}
