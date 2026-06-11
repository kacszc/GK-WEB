"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import type { AuthUser, UserRole } from "@/lib/types";

// We mirror the Firebase-derived user here to avoid a flash of "logged out"
// before onAuthStateChanged fires on load. Cleared explicitly on signOut().
const STORAGE_KEY = "skill_user";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  /** Sign out of Firebase and clear the local session. */
  signOut: () => Promise<void>;
  // --- Firebase-backed auth (priority: Google + email/password) ------------
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  /** Send a password-reset email (Firebase). */
  sendPasswordReset: (email: string) => Promise<void>;
  /** Get a fresh ID token for API calls. `forceRefresh` re-reads custom claims. */
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  /**
   * Re-read the current Firebase user with a forced token refresh and update the
   * app user. Call after the backend changes custom claims (e.g. registerFinalize
   * sets the `role` claim) so the new role is reflected without a page reload.
   */
  refreshUser: () => Promise<void>;
  /** Send (or resend) the email-verification link to the current user. */
  sendVerificationEmail: () => Promise<void>;
  /**
   * Reload the Firebase user (so `emailVerified` reflects a just-clicked link),
   * update the app user, and return the current verification status.
   */
  reloadUser: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Map the backend role claim (EMPLOYER/SPECIALIST) to the frontend role. */
function roleFromClaim(claim: unknown): UserRole {
  return String(claim ?? "").toUpperCase() === "SPECIALIST" ? "specialist" : "employer";
}

/** Derive the app user from a Firebase user + its ID token custom claims. */
async function deriveUser(fb: FirebaseUser, forceRefresh = false): Promise<AuthUser> {
  let role: UserRole = "employer";
  try {
    const res = await fb.getIdTokenResult(forceRefresh);
    role = roleFromClaim(res.claims.role);
  } catch {
    // If claims can't be read, default to employer; backend register fixes it.
  }
  const name = fb.displayName?.trim() || fb.email?.split("@")[0] || "Użytkownik";
  return { name, email: fb.email ?? "", role, emailVerified: fb.emailVerified };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Seed from the mirrored session to avoid a logged-out flash. Deferred so we
    // don't call setState synchronously in the effect body.
    const seed = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setUser(JSON.parse(raw) as AuthUser);
      } catch {
        // ignore corrupt storage
      }
    }, 0);

    const unsub = onAuthStateChanged(firebaseAuth, async (fb) => {
      if (fb) {
        const derived = await deriveUser(fb);
        setUser(derived);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(derived));
        } catch {
          // ignore
        }
      }
      // When `fb` is null we keep any mirrored user from the seed above:
      // signOut() clears it explicitly, so no action is needed here.
      setReady(true);
    });

    // Safety: if Firebase never calls back (e.g. offline), still become ready.
    const t = setTimeout(() => setReady(true), 1500);

    return () => {
      clearTimeout(seed);
      clearTimeout(t);
      unsub();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fbSignOut(firebaseAuth);
    } catch {
      // ignore — still clear local state below
    }
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(firebaseAuth, email, password);
    // onAuthStateChanged updates `user`.
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      if (displayName?.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      // onAuthStateChanged updates `user`.
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(firebaseAuth, provider);
    // onAuthStateChanged updates `user`.
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(firebaseAuth, email);
  }, []);

  const getIdToken = useCallback(async (forceRefresh = false) => {
    const fb = firebaseAuth.currentUser;
    if (!fb) return null;
    try {
      return await fb.getIdToken(forceRefresh);
    } catch {
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const fb = firebaseAuth.currentUser;
    if (!fb) return;
    const derived = await deriveUser(fb, true);
    setUser(derived);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(derived));
    } catch {
      // ignore
    }
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    const fb = firebaseAuth.currentUser;
    if (!fb || fb.emailVerified) return;
    await sendEmailVerification(fb);
  }, []);

  const reloadUser = useCallback(async () => {
    const fb = firebaseAuth.currentUser;
    if (!fb) return false;
    await fb.reload();
    // Force-refresh the ID token so the Bearer sent to the API carries the fresh
    // email_verified / role claims (reload() alone only updates the local user record,
    // not the cached token — otherwise gated writes like /apply 403 after verifying).
    if (fb.emailVerified) {
      await fb.getIdToken(true);
    }
    const derived = await deriveUser(fb, true);
    // Only update state when something actually changed, so polling for the
    // verification link doesn't re-render the app every few seconds.
    setUser((prev) =>
      prev &&
      prev.name === derived.name &&
      prev.email === derived.email &&
      prev.role === derived.role &&
      prev.emailVerified === derived.emailVerified
        ? prev
        : derived,
    );
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(derived));
    } catch {
      // ignore
    }
    return fb.emailVerified;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        signOut,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        getIdToken,
        refreshUser,
        sendVerificationEmail,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// TODO(auth): structure for Apple OAuth (OAuthProvider "apple.com") and
// phone/SMS (RecaptchaVerifier + signInWithPhoneNumber) — wire when enabled in
// the Firebase console. Google + email/password are the current priority.
