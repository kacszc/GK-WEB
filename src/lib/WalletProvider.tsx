"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { walletService } from "@/services";
import { useAuth } from "@/lib/AuthProvider";

const STORAGE_KEY = "skill_tokens";
const DEFAULT_BALANCE = 27;

type WalletContextValue = {
  balance: number;
  ready: boolean;
  /** Whether the balance reflects the real backend wallet (vs. local mock). */
  backed: boolean;
  /** Optimistically lower the local balance (e.g. before a spend completes). */
  spend: (n: number) => boolean;
  /** Optimistically raise the local balance. */
  topUp: (n: number) => void;
  /** Replace the balance with an authoritative value from the backend. */
  setBalance: (n: number) => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [balance, setBalanceState] = useState(DEFAULT_BALANCE);
  const [ready, setReady] = useState(false);
  const [backed, setBacked] = useState(false);

  // Restore the local mock balance once on mount (used when signed out / backend down).
  useEffect(() => {
    const id = setTimeout(() => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw != null && !Number.isNaN(Number(raw))) setBalanceState(Number(raw));
      setReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // When signed in, read the real wallet balance from the backend. On failure
  // (backend down) we silently keep the local mock balance.
  useEffect(() => {
    if (!authReady) return;
    let active = true;
    if (!user) {
      // Deferred to avoid a synchronous setState in the effect body.
      const id = setTimeout(() => active && setBacked(false), 0);
      return () => {
        active = false;
        clearTimeout(id);
      };
    }
    walletService
      .getBalance()
      .then((b) => {
        if (!active) return;
        setBalanceState(b);
        setBacked(true);
        setReady(true);
      })
      .catch(() => {
        // Backend unavailable — fall back to the local mock balance.
      });
    return () => {
      active = false;
    };
  }, [user, authReady]);

  const persist = (v: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(v));
    } catch {
      // ignore
    }
  };

  const spend = useCallback(
    (n: number) => {
      if (balance < n) return false;
      const v = balance - n;
      setBalanceState(v);
      if (!backed) persist(v);
      return true;
    },
    [balance, backed],
  );

  const topUp = useCallback(
    (n: number) => {
      const v = balance + n;
      setBalanceState(v);
      if (!backed) persist(v);
    },
    [balance, backed],
  );

  const setBalance = useCallback((n: number) => {
    setBalanceState(n);
    setBacked(true);
  }, []);

  return (
    <WalletContext.Provider value={{ balance, ready, backed, spend, topUp, setBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
