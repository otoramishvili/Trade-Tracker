"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getTradingAccountState, saveActiveTradingAccount, saveTradingAccounts } from "@/lib/firebase/firestore";
import { MAX_TRADING_ACCOUNTS, normalizeTradingAccounts } from "@/utils/tradingAccounts";

type TradingAccountState = {
  accounts: string[];
  activeAccount: string;
  loading: boolean;
  addAccount: (name: string) => Promise<void>;
  removeAccount: (name: string) => Promise<void>;
  selectAccount: (name: string) => Promise<void>;
};

const TradingAccountContext = createContext<TradingAccountState | null>(null);

export function TradingAccountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [activeAccount, setActiveAccount] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setAccounts([]); setActiveAccount(""); setLoading(false); return; }
    let mounted = true;
    setLoading(true);
    void getTradingAccountState(user.uid).then(state => {
      if (mounted) { setAccounts(state.accounts); setActiveAccount(state.activeAccount); }
    }).catch(error => console.error("Trading accounts could not be loaded.", error)).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [user]);

  const addAccount = useCallback(async (name: string) => {
    if (!user) throw new Error("Not authenticated");
    const clean = name.trim();
    if (!clean) throw new Error("Enter an account name.");
    if (accounts.length >= MAX_TRADING_ACCOUNTS) throw new Error(`You can save up to ${MAX_TRADING_ACCOUNTS} trading accounts.`);
    if (accounts.some(account => account.toLocaleLowerCase() === clean.toLocaleLowerCase())) throw new Error("That trading account already exists.");
    const next = normalizeTradingAccounts([...accounts, clean]);
    await saveTradingAccounts(user.uid, next);
    setAccounts(next);
    if (!activeAccount) { await saveActiveTradingAccount(user.uid, clean); setActiveAccount(clean); }
  }, [user, accounts, activeAccount]);

  const removeAccount = useCallback(async (name: string) => {
    if (!user) throw new Error("Not authenticated");
    const next = accounts.filter(account => account !== name);
    await saveTradingAccounts(user.uid, next);
    setAccounts(next);
    if (activeAccount === name) { await saveActiveTradingAccount(user.uid, ""); setActiveAccount(""); }
  }, [user, accounts, activeAccount]);

  const selectAccount = useCallback(async (name: string) => {
    if (!user) throw new Error("Not authenticated");
    const selected = accounts.includes(name) ? name : "";
    setActiveAccount(selected);
    await saveActiveTradingAccount(user.uid, selected);
  }, [user, accounts]);

  const value = useMemo(() => ({ accounts, activeAccount, loading, addAccount, removeAccount, selectAccount }), [accounts, activeAccount, loading, addAccount, removeAccount, selectAccount]);
  return <TradingAccountContext.Provider value={value}>{loading ? <main className="center-state"><span className="loader" />Loading trading account…</main> : children}</TradingAccountContext.Provider>;
}

export function useTradingAccounts() {
  const value = useContext(TradingAccountContext);
  if (!value) throw new Error("useTradingAccounts must be used inside TradingAccountProvider");
  return value;
}
