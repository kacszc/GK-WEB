/**
 * Token cost to reveal a specialist's contact, scaled 1–8 by their Trust Score (premium specialists
 * cost more). MUST stay in sync with the backend's `WalletService.contactCost` — the backend is the
 * source of truth and charges the real amount; this is only for display.
 */
export function contactTokenCost(trustScore: number): number {
  const score = Math.max(0, Math.min(100, trustScore));
  return Math.max(1, Math.min(8, Math.round(1 + (score / 100) * 7)));
}
