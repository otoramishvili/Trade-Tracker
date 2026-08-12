"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { DeleteTradeDialog } from "@/components/trades/DeleteTradeDialog";
import { TradeTable } from "@/components/trades/TradeTable";
import { deleteTrade, getTrades } from "@/lib/firebase/firestore";
import type { Trade } from "@/types/trade";
import { tradeCsvFilename, tradesToCsv } from "@/utils/tradeCsv";

export default function Trades() {
  return <AuthGuard><TradesContent /></AuthGuard>;
}

function TradesContent() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Trade | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setTrades(await getTrades(user.uid));
    } catch (loadError) {
      console.error(loadError);
      setError("Your trades could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  async function remove() {
    if (!user || !selected) return;
    setDeleting(true);
    try {
      await deleteTrade(user.uid, selected.id);
      setTrades(current => current.filter(trade => trade.id !== selected.id));
      setSelected(null);
    } finally {
      setDeleting(false);
    }
  }

  function exportCsv() {
    const blob = new Blob(["\uFEFF", tradesToCsv(trades)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = tradeCsvFilename();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const wins = trades.filter(trade => trade.outcome === "win").length;
  const losses = trades.filter(trade => trade.outcome === "loss").length;
  const netR = trades.reduce((sum, trade) => sum + (trade.rr ?? 0) * (trade.outcome === "loss" ? -1 : trade.outcome === "win" ? 1 : 0), 0);

  return <main className="app-page trades-page">
    <div className="page-heading">
      <div><p className="eyebrow"><i />Your history</p><h1>Trade journal</h1><p className="page-subtitle">Every decision, result and lesson in one searchable record.</p></div>
      <div className="page-heading-actions"><button className="button secondary" type="button" disabled={!trades.length} onClick={exportCsv}>Export CSV</button><Link className="button" href="/trades/new"><span>＋</span> Add trade</Link></div>
    </div>
    {loading ? <div className="center-state"><span className="loader" />Loading trades…</div> : error ? <p className="alert">{error}</p> : trades.length ? <>
      <section className="journal-overview"><div><span>Total entries</span><strong>{trades.length}</strong><small>All recorded trades</small></div><div><span>Wins / losses</span><strong><b className="positive">{wins}</b><i>/</i><b className="negative">{losses}</b></strong><small>Closed outcomes</small></div><div><span>Net performance</span><strong className={netR > 0 ? "positive" : netR < 0 ? "negative" : ""}>{netR > 0 ? "+" : ""}{netR.toFixed(1)}R</strong><small>From recorded R values</small></div><Link href="/calendar"><span>Calendar view</span><strong>Open month</strong><small>Review trading days →</small></Link></section>
      <TradeTable trades={trades} onDelete={setSelected} />
    </> : <div className="empty-state"><div className="empty-icon">↗</div><h2>No trades yet.</h2><p>Add your first trade to begin building your journal.</p><Link className="button" href="/trades/new">Add trade <span>→</span></Link></div>}
    <DeleteTradeDialog open={Boolean(selected)} busy={deleting} onCancel={() => setSelected(null)} onConfirm={remove} />
  </main>;
}
