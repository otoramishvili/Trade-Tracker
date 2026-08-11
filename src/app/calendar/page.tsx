"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { getTrades } from "@/lib/firebase/firestore";
import type { Trade } from "@/types/trade";
import { dateKey, groupTradesByDate, monthGrid } from "@/utils/calendar";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage() {
  return <AuthGuard><CalendarView /></AuthGuard>;
}

function CalendarView() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setTrades(await getTrades(user.uid));
    } catch (loadError) {
      console.error(loadError);
      setError("Your calendar could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);
  const days = useMemo(() => monthGrid(month), [month]);
  const groups = useMemo(() => groupTradesByDate(trades), [trades]);
  const monthPrefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const monthTrades = trades.filter(trade => trade.date.startsWith(monthPrefix));
  const monthPnl = monthTrades.reduce((sum, trade) => sum + (trade.pnl ?? 0), 0);
  const monthR = monthTrades.reduce((sum, trade) => sum + (trade.rr ?? 0) * (trade.outcome === "loss" ? -1 : trade.outcome === "win" ? 1 : 0), 0);
  const move = (offset: number) => setMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  const today = () => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); };

  if (loading) return <main className="center-state"><span className="loader" />Loading calendar…</main>;

  return <main className="app-page calendar-page">
    <div className="page-heading calendar-heading"><div><p className="eyebrow"><i />Monthly review</p><h1>Trading calendar</h1><p className="page-subtitle">See your consistency, activity and results at a glance.</p></div></div>
    {error ? <p className="alert">{error}</p> : <>
      <section className="calendar-summary">
        <div><span>Trades this month</span><strong>{monthTrades.length}</strong></div>
        <div><span>Recorded P&amp;L</span><strong className={monthPnl > 0 ? "positive" : monthPnl < 0 ? "negative" : ""}>{monthPnl ? `${monthPnl > 0 ? "+" : ""}${monthPnl}` : "—"}</strong></div>
        <div><span>Net R</span><strong className={monthR > 0 ? "positive" : monthR < 0 ? "negative" : ""}>{monthR ? `${monthR > 0 ? "+" : ""}${monthR.toFixed(1)}R` : "—"}</strong></div>
      </section>
      <section className="calendar-card">
        <div className="calendar-toolbar"><div><button aria-label="Previous month" onClick={() => move(-1)}>←</button><button aria-label="Next month" onClick={() => move(1)}>→</button></div><h2>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2><button className="today-button" onClick={today}>Today</button></div>
        <div className="weekday-row">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
        <div className="month-grid">{days.map(day => {
          const dayTrades = groups[day.key] ?? [];
          const pnl = dayTrades.reduce((sum, trade) => sum + (trade.pnl ?? 0), 0);
          const r = dayTrades.reduce((sum, trade) => sum + (trade.rr ?? 0) * (trade.outcome === "loss" ? -1 : trade.outcome === "win" ? 1 : 0), 0);
          return <div key={day.key} className={`calendar-day ${day.currentMonth ? "" : "outside"} ${day.key === dateKey(new Date()) ? "today" : ""}`}><span className="day-number">{day.date.getDate()}</span>{dayTrades.length > 0 && <div className="day-data"><b>{dayTrades.length} {dayTrades.length === 1 ? "trade" : "trades"}</b>{pnl !== 0 ? <span className={pnl > 0 ? "positive" : "negative"}>{pnl > 0 ? "+" : ""}{pnl}</span> : r !== 0 ? <span className={r > 0 ? "positive" : "negative"}>{r > 0 ? "+" : ""}{r.toFixed(1)}R</span> : null}<i className={dayTrades.some(trade => trade.outcome === "win") ? "win" : "loss"} /></div>}</div>;
        })}</div>
      </section>
    </>}
  </main>;
}
