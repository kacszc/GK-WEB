import type { UserRole } from "@/lib/types";
import { apiPost } from "@/lib/api-client";

/** Map the frontend role to the backend enum casing. */
function toBackendRole(role: UserRole): "EMPLOYER" | "SPECIALIST" {
  return role === "specialist" ? "SPECIALIST" : "EMPLOYER";
}

export const authService = {
  /**
   * Finalize registration on the backend after the Firebase account exists.
   * Requires an authenticated request (Bearer token attached by api-client).
   * The backend sets the `role` custom claim; the caller must then refresh the
   * ID token (getIdToken(true)) so the new claim is visible to the client.
   */
  async registerFinalize(role: UserRole): Promise<void> {
    await apiPost("/api/auth/register", { role: toBackendRole(role) });
  },
};
