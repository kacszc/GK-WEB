import type { TokenPackage, WalletTx, Plan } from "@/lib/types";
// import { apiGet } from "@/lib/api-client";
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

export const walletService = {
  async getBalance(): Promise<number> {
    // TODO(backend): return apiGet("/me/wallet/balance");
    await mockDelay(300, 700);
    return 27;
  },
  async getPackages(): Promise<TokenPackage[]> {
    // TODO(backend): return apiGet("/wallet/packages");
    await mockDelay(200, 500);
    return PACKAGES;
  },
  async getPlans(): Promise<Plan[]> {
    await mockDelay(200, 500);
    return PLANS;
  },
  async getTransactions(): Promise<WalletTx[]> {
    // TODO(backend): return apiGet("/me/wallet/transactions");
    await mockDelay(300, 700);
    return TX;
  },
  async buy(packageId: string): Promise<{ tokens: number; invoice: string }> {
    // TODO(backend): return apiPost("/wallet/purchase", { packageId });
    await mockDelay(800, 1400);
    const pkg = PACKAGES.find((p) => p.id === packageId);
    return { tokens: pkg?.tokens ?? 0, invoice: `FV/2026/05/${Math.floor(Date.now() / 1000) % 9000}` };
  },
};
