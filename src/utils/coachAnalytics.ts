import type { Trade } from "@/types/trade";

type Bucket = { trades: number; wins: number; losses: number; pnl: number; pnlCount: number; netR: number };

function bucket(trades: readonly Trade[]): Bucket {
  return {
    trades: trades.length,
    wins: trades.filter(trade => trade.outcome === "win").length,
    losses: trades.filter(trade => trade.outcome === "loss").length,
    pnl: trades.reduce((sum, trade) => sum + (trade.pnl ?? 0), 0),
    pnlCount: trades.filter(trade => trade.pnl != null).length,
    netR: trades.reduce((sum, trade) => sum + (trade.rr ?? 0) * (trade.outcome === "loss" ? -1 : trade.outcome === "win" ? 1 : 0), 0),
  };
}

function groups(trades: readonly Trade[], value: (trade: Trade) => string | undefined) {
  const map = new Map<string, Trade[]>();
  for (const trade of trades) {
    const key = value(trade)?.trim() || "not_recorded";
    map.set(key, [...(map.get(key) ?? []), trade]);
  }
  return Object.fromEntries([...map.entries()].map(([key, items]) => [key, bucket(items)]));
}

export function buildCoachEvidence(trades: readonly Trade[], accountName: string) {
  const ordered = [...trades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 500);
  const closed = ordered.filter(trade => trade.outcome === "win" || trade.outcome === "loss");
  const summary = bucket(ordered);
  const recent = ordered.slice(0, 20);
  return {
    scope: accountName || "all_accounts",
    sampleSize: ordered.length,
    closedTrades: closed.length,
    winRate: closed.length ? Number((summary.wins / closed.length * 100).toFixed(1)) : null,
    summary,
    bySession: groups(ordered, trade => trade.session),
    bySymbol: groups(ordered, trade => trade.symbol),
    byPosition: groups(ordered, trade => trade.position),
    bySetup: groups(ordered, trade => trade.setup),
    byWeekday: groups(ordered, trade => trade.dayOfWeek || (trade.date ? new Date(`${trade.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" }) : undefined)),
    recentTrades: recent.map(trade => ({ date: trade.date, symbol: trade.symbol, session: trade.session ?? null, position: trade.position, outcome: trade.outcome ?? null, pnl: trade.pnl ?? null, rr: trade.rr ?? null, setup: trade.setup?.slice(0, 80) ?? null, emotion: trade.emotion?.slice(0, 80) ?? null, preTradeNotes: trade.preTradeNotes?.slice(0, 300) ?? null, postTradeNotes: trade.postTradeNotes?.slice(0, 300) ?? null })),
  };
}
