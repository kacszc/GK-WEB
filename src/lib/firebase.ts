// Firebase initialization (client SDK). Used for Auth + Analytics.
// Config is read from NEXT_PUBLIC_FIREBASE_* env vars when present, otherwise
// falls back to the project literals so the app works out of the box.
//
// Analytics is initialized lazily and ONLY in a supported browser environment
// (guarded by isSupported()), so SSR/build never crash.

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import type { Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyAnmI30PMVu9brfnAxA7uyiuPj5dHzwiJw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "ugkr-c5184.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "ugkr-c5184",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "ugkr-c5184.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "954537640375",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:954537640375:web:14b2489bf35b3466336832",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-KTFJGHHXGM",
};

// Reuse the existing app across HMR / repeated imports.
export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth: Auth = getAuth(firebaseApp);

let analyticsInstance: Analytics | null = null;

/**
 * Initialize Firebase Analytics in the browser, only if supported.
 * Safe to call multiple times — returns the cached instance.
 * Resolves to null on the server, during build, or when unsupported.
 */
export async function initAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (!(await isSupported())) return null;
    analyticsInstance = getAnalytics(firebaseApp);
    return analyticsInstance;
  } catch {
    // Analytics is best-effort; never break the app if it fails to load.
    return null;
  }
}
