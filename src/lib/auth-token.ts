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
export async function getCurrentIdToken(forceRefresh = false): Promise<string | null> {
  if (typeof window === "undefined") return null;
  // Wait for Firebase to restore the persisted session before reading currentUser. On a fresh
  // reload `currentUser` is null during the restore window, so without this an API call fired by a
  // component gated on the (localStorage-mirrored) user would go out token-less and 401.
  try {
    await firebaseAuth.authStateReady();
  } catch {
    // Older SDK / unavailable — fall through to a best-effort read.
  }
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}
