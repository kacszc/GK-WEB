import type { TokenPackage, WalletTx, WalletTxType, Plan } from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api-client";
import { mockDelay } from "./mock-data";

const PACKAGES: TokenPackage[] = [
  { id: "p15", tokens: 15, pricePerToken: 2.45 },
  { id: "p50", tokens: 50, pricePerToken: 2.38, popular: true },
  { id: "p150", tokens: 150, pricePerToken: 1.99 },
  { id: "p400", tokens: 400, pricePerToken: 1.75 },
];

const PLANS: Plan[] = [
  {
    id: "pro",
    name: "PRO",
    price: 39,
    period: "mies.",
    perks: ["1 boost profilu / mies. (gratis)", "Wyższa pozycja w wynikach", "Odznaka PRO", "Statystyki profilu"],
    highlight: true,
  },
  {
    id: "boost",
    name: "Boost",
    price: 19,
    period: "jednorazowo",
    perks: ["Pozycja #1 w kategorii", "7 dni widoczności", "Wyróżnienie na liście"],
  },
];

const TX: WalletTx[] = [
  { id: "t1", type: "purchase", amount: 50, label: "Pakiet 50 tokenów", date: "12 maja 2026", invoice: "FV/2026/05/0124" },
  { id: "t2", type: "spend", amount: -3, label: "Kontakt — Anna K.", date: "13 maja 2026" },
  { id: "t3", type: "spend", amount: -3, label: "Kontakt — Tomasz P.", date: "14 maja 2026" },
  { id: "t4", type: "bonus", amount: 5, label: "Bonus powitalny", date: "10 maja 2026" },
];

// --- Backend DTOs ---------------------------------------------------------

type WalletDto = { balance: number };
type TxDto = {
  id: string;
  type: string;
  amount: number;
  priceGrosze?: number;
  description: string;
  createdAt: string;
};
type PackageDto = {
  id: string;
  name?: string;
  tokens: number;
  priceGrosze: number;
  bonus?: number;
  popular?: boolean;
};
type PlanDto = {
  code: string;
  name: string;
  priceGrosze: number;
  period: string;
  popular?: boolean;
  features?: string[];
};

/** Grosze → zł. */
const zl = (grosze: number) => grosze / 100;

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
  const price = zl(d.priceGrosze);
  return {
    id: d.id,
    tokens,
    pricePerToken: tokens > 0 ? price / tokens : 0,
    popular: d.popular,
  };
}

function toPlan(d: PlanDto): Plan {
  return {
    id: d.code,
    name: d.name,
    price: zl(d.priceGrosze),
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
    try {
      const dtos = await apiGet<PackageDto[]>("/api/wallet/packages");
      return dtos.map(toPackage);
    } catch {
      await mockDelay(200, 500);
      return PACKAGES;
    }
  },
  async getPlans(): Promise<Plan[]> {
    try {
      const dtos = await apiGet<PlanDto[]>("/api/wallet/plans");
      return dtos.map(toPlan);
    } catch {
      await mockDelay(200, 500);
      return PLANS;
    }
  },
  async getTransactions(): Promise<WalletTx[]> {
    try {
      const dtos = await apiGet<TxDto[]>("/api/wallet/transactions");
      return dtos.map(toWalletTx);
    } catch {
      await mockDelay(300, 700);
      return TX;
    }
  },
  /** Buy a package; returns the new balance (backend) or a mock token count. */
  async buy(packageId: string): Promise<{ balance?: number; tokens: number; invoice: string }> {
    try {
      const dto = await apiPost<WalletDto>("/api/wallet/buy", { packageId });
      const pkg = PACKAGES.find((p) => p.id === packageId);
      return {
        balance: dto.balance,
        tokens: pkg?.tokens ?? 0,
        invoice: `FV/2026/05/${Math.floor(Date.now() / 1000) % 9000}`,
      };
    } catch {
      await mockDelay(800, 1400);
      const pkg = PACKAGES.find((p) => p.id === packageId);
      return { tokens: pkg?.tokens ?? 0, invoice: `FV/2026/05/${Math.floor(Date.now() / 1000) % 9000}` };
    }
  },
};
