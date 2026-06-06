"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import type { AuthUser, UserRole } from "@/lib/types";

// Legacy local-session key. We still mirror the derived user here so that the
// app keeps working when Firebase is unavailable (and to avoid a flash of
// "logged out" before onAuthStateChanged fires).
const STORAGE_KEY = "skill_user";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  /**
   * Backward-compatible local sign-in. Sets the app user synchronously without
   * touching Firebase. Used by the onboarding flows which already have the user
   * data and (separately) create the Firebase account / finalize on the backend.
   */
  signIn: (user: AuthUser) => void;
  /** Sign out of Firebase and clear the local session. */
  signOut: () => Promise<void>;
  // --- Firebase-backed auth (priority: Google + email/password) ------------
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  /** Get a fresh ID token for API calls. `forceRefresh` re-reads custom claims. */
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Map the backend role claim (EMPLOYER/SPECIALIST) to the frontend role. */
function roleFromClaim(claim: unknown): UserRole {
  return String(claim ?? "").toUpperCase() === "SPECIALIST" ? "specialist" : "employer";
}

/** Derive the app user from a Firebase user + its ID token custom claims. */
async function deriveUser(fb: FirebaseUser): Promise<AuthUser> {
  let role: UserRole = "employer";
  try {
    const res = await fb.getIdTokenResult();
    role = roleFromClaim(res.claims.role);
  } catch {
    // If claims can't be read, default to employer; backend register fixes it.
  }
  const name = fb.displayName?.trim() || fb.email?.split("@")[0] || "Użytkownik";
  return { name, email: fb.email ?? "", role };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Seed from the legacy local session to avoid a logged-out flash. Deferred
    // so we don't call setState synchronously in the effect body.
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
      // When `fb` is null we keep any locally-seeded user (mock/onboarding):
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

  const signIn = useCallback((u: AuthUser) => {
    setUser(u);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {
      // ignore
    }
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

  const getIdToken = useCallback(async (forceRefresh = false) => {
    const fb = firebaseAuth.currentUser;
    if (!fb) return null;
    try {
      return await fb.getIdToken(forceRefresh);
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        signIn,
        signOut,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        getIdToken,
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
