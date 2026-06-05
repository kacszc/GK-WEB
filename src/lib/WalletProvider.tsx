"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "skill_tokens";
const DEFAULT_BALANCE = 27;

type WalletContextValue = {
  balance: number;
  ready: boolean;
  spend: (n: number) => boolean;
  topUp: (n: number) => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(DEFAULT_BALANCE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw != null && !Number.isNaN(Number(raw))) setBalance(Number(raw));
      setReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const persist = (v: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(v));
    } catch {
      // ignore
    }
  };

  const spend = (n: number) => {
    if (balance < n) return false;
    const v = balance - n;
    setBalance(v);
    persist(v);
    return true;
  };

  const topUp = (n: number) => {
    const v = balance + n;
    setBalance(v);
    persist(v);
  };

  return (
    <WalletContext.Provider value={{ balance, ready, spend, topUp }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
