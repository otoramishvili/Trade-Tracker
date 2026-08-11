"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { getTrades } from "@/lib/firebase/firestore";
import { tradeStats } from "@/utils/tradeStats";
import type { Trade } from "@/types/trade";
export default function Dashboard() { return <AuthGuard><DashboardContent /></AuthGuard>; }
function DashboardContent() { const { user } = useAuth(), [trades, setTrades] = useState<Trade[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(""); const load = useCallback(async () => { if (user) {
    try {
        setTrades(await getTrades(user.uid));
    }
    catch (err) {
        console.error(err);
        setError("Your dashboard could not be loaded. Please refresh and try again.");
    }
    finally {
        setLoading(false);
    }
} }, [user]); useEffect(() => { void load(); }, [load]); if (loading)
    return <main className="center-state"><span className="loader"/>Loading dashboard…</main>; if (error)
    return <main className="app-page"><p className="alert" role="alert">{error}</p></main>; const stats = tradeStats(trades); const cards: Array<[
    string,
    string | number,
    string
]> = [["Total trades", stats.total, "All journal entries"], ["Wins", stats.wins, "Closed in profit"], ["Losses", stats.losses, "Closed at a loss"], ["Win rate", `${stats.winRate.toFixed(1)}%`, "Excludes breakeven"]]; if (stats.pnlCount)
    cards.push(["Total P&L", stats.totalPnl, "Recorded P&L only"]); return <main className="app-page"><div className="page-heading"><div><p className="eyebrow"><i />Performance overview</p><h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.displayName?.split(" ")[0] || "trader"}.</h1><p className="page-subtitle">Here is what your journal is telling you.</p></div><Link className="button" href="/trades/new"><span>＋</span> Add trade</Link></div>{!trades.length ? <div className="empty-state"><div className="empty-icon">↗</div><h2>Your journal starts here.</h2><p>Add your first trade to start building a clear performance history.</p><Link className="button" href="/trades/new">Add your first trade <span>→</span></Link></div> : <><section className="stats">{cards.map(([label, value, detail], i) => <article className={`stat stat-${i}`} key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</section><section className="journal-panel"><div className="panel-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent trades</h2></div><Link href="/trades">View full journal <span>→</span></Link></div><div className="recent-list">{trades.slice(0, 5).map(t => <Link href={`/trades/${t.id}`} className="recent-row" key={t.id}><span className="trade-symbol">{t.symbol.slice(0, 2)}</span><span><b>{t.symbol}</b><small>{t.date} · {t.session?.replace("_", " ") || "No session"}</small></span><span className={`side ${t.position}`}>{t.position}</span><span>{t.rr != null ? `${t.rr}R` : "—"}</span><span className={`pill ${t.outcome ?? ""}`}>{t.outcome ?? "Not set"}</span><b className="row-arrow">→</b></Link>)}</div></section></>}</main>; }
