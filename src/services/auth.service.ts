import type { AuthUser, UserRole } from "@/lib/types";
// import { apiGet } from "@/lib/api-client";
import { mockDelay } from "./mock-data";

function nameFromEmail(email: string): string {
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!local) return "Użytkownik";
  return local.replace(/\b\w/g, (c) => c.toUpperCase());
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    // TODO(backend): return apiPost("/auth/login", { email, password });
    void password; // mock: password not checked yet
    await mockDelay(500, 1000);
    return { name: nameFromEmail(email), email, role: "employer" };
  },

  async register(payload: { name: string; email: string; role: UserRole }): Promise<AuthUser> {
    // TODO(backend): return apiPost("/auth/register", payload);
    await mockDelay(600, 1100);
    return { name: payload.name.trim() || nameFromEmail(payload.email), email: payload.email, role: payload.role };
  },
};
