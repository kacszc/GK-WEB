// Bridge between Firebase Auth (client-only) and the plain `api-client` module.
//
// The api-client is a framework-agnostic module that cannot use React hooks,
// so it can't call useAuth(). Instead we read the current Firebase ID token
// directly from the Firebase SDK here. This keeps the dependency one-directional
// (api-client -> auth-token -> firebase) and avoids importing React.

import { firebaseAuth } from "@/lib/firebase";

/**
 * Returns a fresh Firebase ID token for the signed-in user, or null when no one
 * is signed in / running on the server / Firebase is unavailable.
 */
export async function getCurrentIdToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}
