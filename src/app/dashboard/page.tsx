"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTradingAccounts } from "@/components/accounts/TradingAccountProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { getTrades } from "@/lib/firebase/firestore";
import type { Trade } from "@/types/trade";
import { tradeStats } from "@/utils/tradeStats";
import { tradesForAccount } from "@/utils/tradeAccounts";

export default function Dashboard() { return <AuthGuard><DashboardContent /></AuthGuard>; }

function DashboardContent() {
  const { user } = useAuth();
  const { activeAccount } = useTradingAccounts();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!user) return;
    try { setTrades(await getTrades(user.uid)); }
    catch (loadError) { console.error(loadError); setError("Your dashboard could not be loaded. Please refresh and try again."); }
    finally { setLoading(false); }
  }, [user]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <main className="center-state"><span className="loader" />Loading dashboard…</main>;
  if (error) return <main className="app-page"><p className="alert" role="alert">{error}</p></main>;
  const visibleTrades = tradesForAccount(trades, activeAccount);
  const stats = tradeStats(visibleTrades);
  const cards: Array<[string, string | number, string]> = [["Total trades", stats.total, activeAccount || "All accounts"], ["Wins", stats.wins, "Closed in profit"], ["Losses", stats.losses, "Closed at a loss"], ["Win rate", `${stats.winRate.toFixed(1)}%`, "Excludes breakeven"]];
  if (stats.pnlCount) cards.push(["Total P&L", stats.totalPnl, "Recorded P&L only"]);
  return <main className="app-page"><div className="page-heading"><div><p className="eyebrow"><i />Performance overview</p><h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.displayName?.split(" ")[0] || "trader"}.</h1><p className="page-subtitle">{activeAccount ? `Performance for ${activeAccount}.` : "Performance across all accounts."}</p></div><Link className="button" href="/trades/new"><span>＋</span> Add trade</Link></div>{!visibleTrades.length ? <div className="empty-state"><div className="empty-icon">↗</div><h2>No trades for this account.</h2><p>Add a trade or switch accounts from the sidebar.</p><Link className="button" href="/trades/new">Add your first trade <span>→</span></Link></div> : <><section className="stats">{cards.map(([label, value, detail], index) => <article className={`stat stat-${index}`} key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</section><section className="journal-panel"><div className="panel-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent trades</h2></div><Link href="/trades">View full journal <span>→</span></Link></div><div className="recent-list">{visibleTrades.slice(0, 5).map(trade => <Link href={`/trades/${trade.id}`} className="recent-row" key={trade.id}><span className="trade-symbol">{trade.symbol.slice(0, 2)}</span><span><b>{trade.symbol}</b><small>{trade.date} · {trade.session?.replace("_", " ") || "No session"}</small></span><span className={`side ${trade.position}`}>{trade.position}</span><span>{trade.rr != null ? `${trade.rr}R` : "—"}</span><span className={`pill ${trade.outcome ?? ""}`}>{trade.outcome ?? "Not set"}</span><b className="row-arrow">→</b></Link>)}</div></section></>}</main>;
}
