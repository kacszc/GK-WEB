import { apiGet, apiPost } from "@/lib/api-client";

export type KycStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export const kycService = {
  /** Current user's KYC status. Returns NONE on failure / signed out. */
  async status(): Promise<KycStatus> {
    try {
      const dto = await apiGet<{ status: KycStatus }>("/api/me/kyc");
      return dto.status ?? "NONE";
    } catch {
      return "NONE";
    }
  },

  /** Submit an identity document for verification; returns the resulting status. */
  async submit(documentType: string): Promise<KycStatus> {
    const dto = await apiPost<{ status: KycStatus }>("/api/me/kyc", { documentType });
    return dto.status ?? "PENDING";
  },
};
