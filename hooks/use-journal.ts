"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAccounts, getTrades } from "@/services/journal";
import type { Account, Trade } from "@/types";

export function useJournal() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (!user) { setAccounts([]); setTrades([]); setError(""); setLoading(false); return; }
    try {
      setLoading(true);
      const [nextAccounts, nextTrades] = await Promise.all([getAccounts(user.uid), getTrades(user.uid)]);
      setAccounts(nextAccounts); setTrades(nextTrades); setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load journal");
    } finally { setLoading(false); }
  }, [user]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { accounts, trades, loading, error, refresh };
}
