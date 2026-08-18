"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTradingAccounts } from "@/components/accounts/TradingAccountProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { DeleteTradeDialog } from "@/components/trades/DeleteTradeDialog";
import { TradeTable } from "@/components/trades/TradeTable";
import { deleteTrade, getTrades } from "@/lib/firebase/firestore";
import type { Trade } from "@/types/trade";
import { tradeCsvFilename, tradesToCsv } from "@/utils/tradeCsv";
import { tradesForAccount } from "@/utils/tradeAccounts";

export default function Trades() { return <AuthGuard><TradesContent /></AuthGuard>; }

function TradesContent() {
  const { user } = useAuth();
  const { accounts, activeAccount } = useTradingAccounts();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Trade | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try { setTrades(await getTrades(user.uid)); }
    catch (loadError) { console.error(loadError); setError("Your trades could not be loaded. Please try again."); }
    finally { setLoading(false); }
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  async function remove() {
    if (!user || !selected) return;
    setDeleting(true);
    try { await deleteTrade(user.uid, selected.id); setTrades(current => current.filter(trade => trade.id !== selected.id)); setSelected(null); }
    finally { setDeleting(false); }
  }

  const visibleTrades = tradesForAccount(trades, activeAccount);

  function exportCsv() {
    const blob = new Blob(["\uFEFF", tradesToCsv(visibleTrades)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = tradeCsvFilename(); document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  }

  const wins = visibleTrades.filter(trade => trade.outcome === "win").length;
  const losses = visibleTrades.filter(trade => trade.outcome === "loss").length;
  const netR = visibleTrades.reduce((sum, trade) => sum + (trade.rr ?? 0) * (trade.outcome === "loss" ? -1 : trade.outcome === "win" ? 1 : 0), 0);

  return <main className="app-page trades-page">
    <div className="page-heading"><div><p className="eyebrow"><i />Your history</p><h1>Trade journal</h1><p className="page-subtitle">{activeAccount ? `Showing trades for ${activeAccount}.` : "Showing trades from all accounts."}</p></div><div className="page-heading-actions"><button className="button secondary" type="button" disabled={!visibleTrades.length} onClick={exportCsv}>Export CSV</button><Link className="button" href={accounts.length ? "/trades/new" : "/settings#trading-accounts"}><span>{accounts.length ? "＋" : "◇"}</span> {accounts.length ? "Add trade" : "Add account"}</Link></div></div>
    {loading ? <div className="center-state"><span className="loader" />Loading trades…</div> : error ? <p className="alert">{error}</p> : visibleTrades.length ? <><section className="journal-overview"><div><span>Total entries</span><strong>{visibleTrades.length}</strong><small>{activeAccount || "All accounts"}</small></div><div><span>Wins / losses</span><strong><b className="positive">{wins}</b><i>/</i><b className="negative">{losses}</b></strong><small>Closed outcomes</small></div><div><span>Net performance</span><strong className={netR > 0 ? "positive" : netR < 0 ? "negative" : ""}>{netR > 0 ? "+" : ""}{netR.toFixed(1)}R</strong><small>From recorded R values</small></div><Link href="/calendar"><span>Calendar view</span><strong>Open month</strong><small>Review trading days →</small></Link></section><TradeTable trades={visibleTrades} onDelete={setSelected} /></> : <div className="empty-state"><div className="empty-icon">↗</div><h2>{accounts.length ? "No trades for this account." : "Add a trading account first."}</h2><p>{accounts.length ? (activeAccount ? `Add a trade to ${activeAccount} or switch accounts from the sidebar.` : "Add your first trade to begin building your journal.") : "Every trade must belong to a saved or connected trading account."}</p><Link className="button" href={accounts.length ? "/trades/new" : "/settings#trading-accounts"}>{accounts.length ? "Add trade" : "Add trading account"} <span>→</span></Link></div>}
    <DeleteTradeDialog open={Boolean(selected)} busy={deleting} onCancel={() => setSelected(null)} onConfirm={remove} />
  </main>;
}
