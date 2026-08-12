"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { DeleteTradeDialog } from "@/components/trades/DeleteTradeDialog";
import { ChartGallery } from "@/components/trades/ChartGallery";
import { deleteTrade, getTrade } from "@/lib/firebase/firestore";
import type { Trade } from "@/types/trade";
import { timestampToDate } from "@/utils/timestamps";
import { useTradingAccounts } from "@/components/accounts/TradingAccountProvider";
import { tradeBelongsToAccount } from "@/utils/tradeAccounts";
export default function TradeDetail() { return <AuthGuard><Detail /></AuthGuard>; }
function Detail() {
    const { user } = useAuth();
    const { activeAccount } = useTradingAccounts();
    const { id } = useParams<{
        id: string;
    }>();
    const router = useRouter();
    const [trade, setTrade] = useState<Trade | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const load = useCallback(async () => { if (!user)
        return; try {
        const loadedTrade = await getTrade(user.uid, id);
        if (loadedTrade && !tradeBelongsToAccount(loadedTrade, activeAccount)) {
            setTrade(null);
            setError("This trade belongs to a different trading account.");
        } else {
            setTrade(loadedTrade);
        }
    }
    catch (err) {
        console.error(err);
        setError("This trade could not be loaded.");
    }
    finally {
        setLoading(false);
    } }, [user, id, activeAccount]);
    useEffect(() => { void load(); }, [load]);
    async function remove() { if (!user)
        return; setDeleting(true); try {
        await deleteTrade(user.uid, id);
        router.push("/trades");
    }
    finally {
        setDeleting(false);
    } }
    if (loading)
        return <main className="center-state"><span className="loader"/>Loading trade…</main>;
    if (error)
        return <main className="app-page"><p className="alert">{error}</p></main>;
    if (!trade)
        return <main className="empty-state"><div className="empty-icon">?</div><h1>Trade not found</h1><p>It may have been removed or belongs to another account.</p><Link className="button" href="/trades">Back to journal</Link></main>;
    const created = timestampToDate(trade.createdAt);
    const updated = timestampToDate(trade.updatedAt);
    const numberItems = [
        ["Entry price", formatNumber(trade.entryPrice)],
        ["Exit price", formatNumber(trade.exitPrice)],
        ["Risk", trade.riskPercent != null ? `${trade.riskPercent}%` : null],
        ["Risk amount", formatNumber(trade.riskAmount)],
        ["Position size", trade.lots != null ? `${trade.lots} lots` : null],
        ["Balance before", formatNumber(trade.balanceBefore)],
        ["P&L percentage", trade.pnlPercent != null ? `${trade.pnlPercent}%` : null],
    ].filter((item): item is [
        string,
        string
    ] => item[1] != null);
    const hasPsychology = Boolean(trade.emotion || trade.setup);
    const hasNotes = Boolean(trade.preTradeNotes || trade.postTradeNotes);
    return <main className="app-page trade-detail-page">
    <div className="detail-topbar"><Link href="/trades">← <span>Back to journal</span></Link><div><Link className="detail-action" href={`/trades/${id}/edit`}>✎ <span>Edit trade</span></Link><button className="detail-action danger-ghost" onClick={() => setShowDelete(true)}>× <span>Delete</span></button></div></div>

    <section className="trade-review-hero">
      <div className="review-identity"><span className="review-symbol">{trade.symbol.slice(0, 2)}</span><div><div className="review-labels"><span className={`side-chip ${trade.position}`}>{trade.position === "long" ? "↗" : "↘"} {trade.position}</span><span className={`result-badge ${trade.outcome ?? "open"}`}><i />{trade.outcome ?? "open"}</span></div><h1>{trade.symbol}</h1><p>{new Date(`${trade.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}{trade.session ? ` · ${trade.session.replace("_", " ")} session` : ""}</p></div></div>
      <div className="review-result"><span>Trade result</span><strong className={(trade.pnl ?? 0) > 0 ? "positive" : (trade.pnl ?? 0) < 0 ? "negative" : ""}>{trade.pnl != null ? `${trade.pnl > 0 ? "+" : ""}${trade.pnl}` : "No P&L"}</strong><small>{trade.rr != null ? `${trade.rr > 0 ? "+" : ""}${trade.rr}R recorded` : "R multiple not recorded"}</small></div>
    </section>

    <section className="detail-metrics">
      <Metric label="R multiple" value={trade.rr != null ? `${trade.rr}R` : "—"} tone={(trade.rr ?? 0) > 0 ? "positive" : ""}/>
      <Metric label="P&L" value={trade.pnl != null ? `${trade.pnl > 0 ? "+" : ""}${trade.pnl}` : "—"} tone={(trade.pnl ?? 0) > 0 ? "positive" : (trade.pnl ?? 0) < 0 ? "negative" : ""}/>
      <Metric label="Risk" value={trade.riskPercent != null ? `${trade.riskPercent}%` : "—"}/>
      <Metric label="Duration" value={duration(trade.entryTime, trade.exitTime)}/>
    </section>

    <div className="detail-layout">
      <div className="detail-main-column">
        <section className="review-section"><header><div><span>01</span><h2>Execution</h2></div><p>The numbers and timing behind this trade.</p></header>{numberItems.length ? <dl className="execution-grid">{numberItems.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <EmptySection text="No execution numbers were recorded."/>}<div className="timing-strip"><div><span>Entry</span><strong>{trade.entryTime || "Not recorded"}</strong></div><i>→</i><div><span>Exit</span><strong>{trade.exitTime || "Not recorded"}</strong></div></div></section>

        <section className="review-section"><header><div><span>02</span><h2>Trade context</h2></div><p>The setup and state of mind around execution.</p></header>{hasPsychology ? <div className="context-grid"><div><span>Setup</span><strong>{trade.setup || "Not recorded"}</strong></div><div><span>Emotion</span><strong>{trade.emotion || "Not recorded"}</strong></div></div> : <EmptySection text="No setup or emotion was recorded."/>}</section>

        <section className="review-section notes-section"><header><div><span>03</span><h2>Journal notes</h2></div><p>Your thinking before and after the trade.</p></header>{hasNotes ? <div className="notes-grid"><article><span>Before the trade</span><p>{trade.preTradeNotes || "No pre-trade notes."}</p></article><article><span>After the trade</span><p>{trade.postTradeNotes || "No post-trade notes."}</p></article></div> : <EmptySection text="No journal notes were added to this trade."/>}</section>
        <ChartGallery images={trade.chartImages ?? []} />
      </div>

      <aside className="detail-side-column"><section className="trade-meta-card"><h3>Entry details</h3><dl><div><dt>Created via</dt><dd><span className="source-dot">✎</span>Manual Entry</dd></div><div><dt>Trade ID</dt><dd className="trade-id">{trade.id}</dd></div>{created && <div><dt>Created</dt><dd>{created.toLocaleDateString()}</dd></div>}{updated && <div><dt>Last updated</dt><dd>{updated.toLocaleDateString()}</dd></div>}</dl></section><Link className="side-edit-button" href={`/trades/${id}/edit`}>Edit this trade <span>→</span></Link></aside>
    </div>
    <DeleteTradeDialog open={showDelete} busy={deleting} onCancel={() => setShowDelete(false)} onConfirm={remove}/>
  </main>;
}
function Metric({ label, value, tone = "" }: {
    label: string;
    value: string;
    tone?: string;
}) { return <article><span>{label}</span><strong className={tone}>{value}</strong></article>; }
function EmptySection({ text }: {
    text: string;
}) { return <div className="review-empty"><span>○</span><p>{text}</p></div>; }
function formatNumber(value: number | null | undefined) { return value == null ? null : new Intl.NumberFormat(undefined, { maximumFractionDigits: 5 }).format(value); }
function duration(entry?: string, exit?: string) { if (!entry || !exit)
    return "—"; const [eh, em] = entry.split(":").map(Number), [xh, xm] = exit.split(":").map(Number); let minutes = xh * 60 + xm - (eh * 60 + em); if (minutes < 0)
    minutes += 1440; return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`; }
