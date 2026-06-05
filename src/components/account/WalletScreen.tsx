"use client";

import { useQuery } from "@tanstack/react-query";
import { Coins, ArrowDownLeft, ArrowUpRight, Gift } from "lucide-react";
import { TokenPackages } from "@/components/tokens/TokenPackages";
import { walletService } from "@/services";
import { useWallet } from "@/lib/WalletProvider";
import { useI18n } from "@/i18n/I18nProvider";
import type { WalletTxType } from "@/lib/types";

const txIcon: Record<WalletTxType, React.ComponentType<{ className?: string }>> = {
  purchase: ArrowUpRight,
  spend: ArrowDownLeft,
  bonus: Gift,
};

export function WalletScreen() {
  const { t } = useI18n();
  const { balance } = useWallet();
  const { data: tx = [] } = useQuery({ queryKey: ["walletTx"], queryFn: walletService.getTransactions });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("tokens.walletTitle")}</h1>

      {/* Balance */}
      <div className="flex items-center gap-4 rounded-panel bg-ink p-6 text-on-dark">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/16">
          <Coins className="h-6 w-6 text-[#e0a400]" />
        </span>
        <div>
          <p className="text-[12px] text-on-dark-3">{t("tokens.balance")}</p>
          <p className="text-3xl font-bold">{t("tokens.balanceTokens", { n: balance })}</p>
        </div>
      </div>

      {/* Buy */}
      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-ink">{t("tokens.buyTokens")}</h2>
        <TokenPackages />
      </section>

      {/* History */}
      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-ink">{t("tokens.history")}</h2>
        <div className="overflow-hidden rounded-panel border border-line-3 bg-surface">
          {tx.map((it, i) => {
            const Icon = txIcon[it.type];
            const positive = it.amount > 0;
            return (
              <div
                key={it.id}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-line" : ""}`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pill text-ink-2">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{it.label}</p>
                  <p className="text-[11px] text-ink-4">
                    {it.date}
                    {it.invoice ? ` · ${it.invoice}` : ""}
                  </p>
                </div>
                <span className={positive ? "text-sm font-bold text-success" : "text-sm font-bold text-ink"}>
                  {positive ? "+" : ""}
                  {it.amount}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
