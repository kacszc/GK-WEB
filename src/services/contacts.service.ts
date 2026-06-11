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
  async reveal(specialistId: string, jobId?: string): Promise<ContactReveal> {
    // No mock fallback: revealing must hit the backend (it debits the wallet).
    // jobId scopes the charge to a job (Model B): the same specialist for a different
    // job is a new reveal; omit it for a job-less ("cold") contact from search.
    return apiPost<ContactReveal>("/api/contacts", { specialistId, jobId: jobId ?? null });
  },
};
