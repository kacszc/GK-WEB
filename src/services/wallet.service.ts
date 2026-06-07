import type { TokenPackage, WalletTx, WalletTxType, Plan } from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api-client";

// --- Backend DTOs ---------------------------------------------------------

type WalletDto = { balance: number };
type TxDto = {
  id: string;
  type: string;
  amount: number;
  paidMinor?: number;
  currency?: string;
  description: string;
  createdAt: string;
};
type PackageDto = {
  id: string;
  name?: string;
  tokens: number;
  priceMinor: number;
  currency: string;
  bonus?: number;
  popular?: boolean;
};
type PlanDto = {
  code: string;
  name: string;
  priceMinor: number;
  currency: string;
  period: string;
  popular?: boolean;
  features?: string[];
};

/** Minor units (grosz/cent) → major (zł/€/$). 2-decimal currencies (PLN/EUR/USD). */
const toMajor = (minor: number) => minor / 100;

/** Map a backend tx `type` to the UI's transaction kind. */
function txType(type: string, amount: number): WalletTxType {
  const t = type.toUpperCase();
  if (t.includes("BONUS")) return "bonus";
  if (t.includes("PURCHASE") || t.includes("TOPUP") || t.includes("BUY")) return "purchase";
  if (t.includes("SPEND") || t.includes("CONTACT")) return "spend";
  return amount >= 0 ? "purchase" : "spend";
}

function toWalletTx(d: TxDto): WalletTx {
  const date = new Date(d.createdAt);
  return {
    id: d.id,
    type: txType(d.type, d.amount),
    amount: d.amount,
    label: d.description,
    date: Number.isNaN(date.getTime())
      ? d.createdAt
      : date.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }),
  };
}

function toPackage(d: PackageDto): TokenPackage {
  const tokens = d.tokens + (d.bonus ?? 0);
  const price = toMajor(d.priceMinor);
  return {
    id: d.id,
    tokens,
    pricePerToken: tokens > 0 ? price / tokens : 0,
    currency: d.currency ?? "PLN",
    popular: d.popular,
  };
}

function toPlan(d: PlanDto): Plan {
  return {
    id: d.code,
    name: d.name,
    price: toMajor(d.priceMinor),
    currency: d.currency ?? "PLN",
    period: d.period?.toUpperCase().startsWith("MONTH") || d.period === "mies." ? "mies." : "jednorazowo",
    perks: d.features ?? [],
    highlight: d.popular,
  };
}

export const walletService = {
  async getBalance(): Promise<number> {
    const dto = await apiGet<WalletDto>("/api/wallet");
    return dto.balance;
  },
  async getPackages(): Promise<TokenPackage[]> {
    const dtos = await apiGet<PackageDto[]>("/api/wallet/packages");
    return dtos.map(toPackage);
  },
  async getPlans(): Promise<Plan[]> {
    const dtos = await apiGet<PlanDto[]>("/api/wallet/plans");
    return dtos.map(toPlan);
  },
  async getTransactions(): Promise<WalletTx[]> {
    const dtos = await apiGet<TxDto[]>("/api/wallet/transactions");
    return dtos.map(toWalletTx);
  },
  /** Buy a package; returns the new balance + how many tokens it adds (from the catalog). */
  async buy(packageId: string): Promise<{ balance: number; tokens: number; invoice: string }> {
    const dto = await apiPost<WalletDto>("/api/wallet/buy", { packageId });
    const pkg = (await this.getPackages()).find((p) => p.id === packageId);
    return {
      balance: dto.balance,
      tokens: pkg?.tokens ?? 0,
      invoice: `FV/2026/05/${Math.floor(Date.now() / 1000) % 9000}`,
    };
  },
  /** Promote (boost) a job for N days; spends tokens and returns the new balance. */
  async boost(jobId: string, days: number): Promise<{ balance: number }> {
    const dto = await apiPost<WalletDto>("/api/wallet/boost", { jobId, days });
    return { balance: dto.balance };
  },
};
