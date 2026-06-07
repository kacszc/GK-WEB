import { apiPost } from "@/lib/api-client";

/** Revealed contact details + the wallet balance after spending tokens. */
export type ContactReveal = {
  phone: string | null;
  email: string | null;
  balanceAfter: number;
};

export const contactsService = {
  /**
   * Pay-per-contact: spend tokens to reveal a specialist's contact details.
   * Throws `ApiError` with status 422 when the balance is insufficient — the
   * caller shows the token-gate UI in that case.
   */
  async reveal(specialistId: string): Promise<ContactReveal> {
    // No mock fallback: revealing must hit the backend (it debits the wallet).
    return apiPost<ContactReveal>("/api/contacts", { specialistId });
  },
};
