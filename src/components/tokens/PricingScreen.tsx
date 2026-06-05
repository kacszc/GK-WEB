"use client";

import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { TokenPackages } from "./TokenPackages";
import { Button } from "@/components/ui/Button";
import { walletService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

export function PricingScreen() {
  const { t } = useI18n();
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: walletService.getPlans });

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-10 px-4 pt-12 pb-20 sm:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-[-1px] text-ink sm:text-4xl">
          {t("tokens.pricingTitle")}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ink-2">{t("tokens.pricingSubtitle")}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {["tokens.free1", "tokens.free2", "tokens.free3"].map((k) => (
            <span
              key={k}
              className="inline-flex items-center gap-1.5 rounded-full border border-line-3 bg-subtle px-3.5 py-2 text-[13px] font-medium text-ink-key"
            >
              <Check className="h-3.5 w-3.5 text-success" />
              {t(k)}
            </span>
          ))}
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-[15px] font-semibold text-ink">{t("tokens.packagesTitle")}</h2>
        <TokenPackages />
      </section>

      <section>
        <h2 className="mb-4 text-[15px] font-semibold text-ink">{t("tokens.plansTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
          {plans.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex flex-col rounded-panel border bg-surface p-6",
                p.highlight ? "border-brand-violet shadow-search" : "border-line-3",
              )}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-ink">{p.name}</span>
                <span className="text-sm text-ink-2">
                  <span className="text-xl font-bold text-ink">{p.price} zł</span>{" "}
                  {p.period === "mies." ? t("tokens.perMonth") : t("tokens.oneTime")}
                </span>
              </div>
              <ul className="mt-4 flex flex-col gap-2">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-[13px] text-ink-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {perk}
                  </li>
                ))}
              </ul>
              <Button
                variant={p.highlight ? "gradient" : "outline"}
                className="mt-5 w-full rounded-tile py-2.5 text-sm"
              >
                {t("tokens.choosePlan")}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
