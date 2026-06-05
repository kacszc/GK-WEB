"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, Check, Loader2, CreditCard } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { walletService } from "@/services";
import { useWallet } from "@/lib/WalletProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import type { TokenPackage } from "@/lib/types";

const priceOf = (p: TokenPackage) => Math.round(p.tokens * p.pricePerToken);

export function TokenPackages() {
  const { t } = useI18n();
  const [selected, setSelected] = useState<TokenPackage | null>(null);
  const { data: packages = [] } = useQuery({
    queryKey: ["tokenPackages"],
    queryFn: walletService.getPackages,
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((p) => (
          <div
            key={p.id}
            className={cn(
              "relative flex flex-col rounded-panel border bg-surface p-5",
              p.popular ? "border-brand-violet shadow-search" : "border-line-3",
            )}
          >
            {p.popular && (
              <span className="absolute -top-2.5 left-5 rounded-full bg-gradient-to-r from-brand-violet to-brand-blue px-2.5 py-0.5 text-[11px] font-bold text-white">
                {t("tokens.popular")}
              </span>
            )}
            <Coins className="h-6 w-6 text-[#e0a400]" />
            <div className="mt-3 text-3xl font-bold text-ink">{p.tokens}</div>
            <div className="text-[12px] text-ink-3">{t("tokens.tokensUnit")}</div>
            <div className="mt-3 text-sm font-semibold text-ink">{priceOf(p)} zł</div>
            <div className="text-[12px] text-ink-3">{t("tokens.perToken", { price: p.pricePerToken.toFixed(2) })}</div>
            <div className="mt-1 text-[12px] text-ink-3">
              {t("tokens.contactsApprox", { n: Math.floor(p.tokens / 3) })}
            </div>
            <Button
              variant={p.popular ? "gradient" : "dark"}
              onClick={() => setSelected(p)}
              className="mt-4 w-full rounded-tile py-2.5 text-[13px]"
            >
              {t("tokens.buy")}
            </Button>
          </div>
        ))}
      </div>

      <CheckoutDialog key={selected?.id ?? "none"} pkg={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function CheckoutDialog({ pkg, onClose }: { pkg: TokenPackage | null; onClose: () => void }) {
  const { t } = useI18n();
  const { topUp } = useWallet();
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [invoice, setInvoice] = useState("");

  async function pay() {
    if (!pkg) return;
    setPaying(true);
    try {
      const r = await walletService.buy(pkg.id);
      topUp(r.tokens);
      setInvoice(r.invoice);
      setDone(true);
    } finally {
      setPaying(false);
    }
  }

  const price = pkg ? priceOf(pkg) : 0;

  return (
    <Dialog open={!!pkg} onClose={onClose} title={done ? undefined : t("tokens.checkoutTitle")}>
      {!pkg ? null : done ? (
        <div className="py-2 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-chip text-success-chip-text">
            <Check className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-lg font-bold text-ink">{t("tokens.successTitle")}</h2>
          <p className="mt-1 text-sm text-ink-2">
            {t("tokens.successDesc", { n: pkg.tokens, invoice })}
          </p>
          <Button variant="dark" onClick={onClose} className="mt-5 w-full rounded-tile py-3 text-sm">
            {t("tokens.done")}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-tile bg-subtle p-3 text-sm">
            <span className="inline-flex items-center gap-2 font-semibold text-ink">
              <Coins className="h-4 w-4 text-[#e0a400]" />
              {t("tokens.summary", { tokens: pkg.tokens, price })}
            </span>
          </div>
          <label className="mb-1.5 mt-4 block text-[12px] font-semibold text-ink-3">
            {t("tokens.cardNumber")}
          </label>
          <div className="flex items-center gap-2 rounded-tile border border-line-2 bg-surface px-3">
            <CreditCard className="h-4 w-4 text-ink-4" />
            <input
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              className="w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-4"
            />
          </div>
          <Button
            variant="gradient"
            onClick={pay}
            disabled={paying}
            className="mt-4 w-full rounded-tile py-3 text-sm"
          >
            {paying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("tokens.paying")}
              </>
            ) : (
              t("tokens.pay", { price })
            )}
          </Button>
          <p className="mt-2 text-center text-[12px] text-ink-3">{t("tokens.vat")}</p>
        </>
      )}
    </Dialog>
  );
}
