"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Filter, MoreHorizontal, Plus, Search, TrendingUp } from "lucide-react";
import { useJournal } from "@/hooks/use-journal";
import { deleteTrade } from "@/services/journal";
import { EmptyState, PageTitle } from "@/components/dashboard-shell";
import { TradeForm } from "@/components/trade-form";
import type { Trade } from "@/types";

const PAGE_SIZE = 8;

export default function TradesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accounts, trades, refresh } = useJournal();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState("All");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditing(null);
      setModal(true);
    }
  }, [searchParams]);

  const filtered = useMemo(() => trades.filter((trade) => {
    const account = accounts.find((item) => item.id === trade.accountId)?.name ?? "";
    const matchesSearch = `${trade.symbol} ${account}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (outcome === "All" || trade.outcome === outcome);
  }).sort((a, b) => sort === "oldest" ? a.date.localeCompare(b.date) : sort === "pl" ? b.pl - a.pl : b.date.localeCompare(a.date)), [trades, accounts, search, outcome, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { setPage((value) => Math.min(value, pages)); }, [pages]);
  const open = (trade?: Trade) => { setEditing(trade ?? null); setModal(true); };
  const close = () => { setModal(false); setEditing(null); if (searchParams.has("new")) router.replace("/dashboard/trades"); };
  const remove = async (trade: Trade) => {
    if (trade.id.startsWith("demo-") || !confirm(`Delete ${trade.symbol} trade?`)) return;
    try { setError(""); await deleteTrade(trade.id); await refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not delete trade"); }
  };

  return <div className="page">
    <PageTitle eyebrow="EXECUTION LOG" title="All trades" description="Search, filter and review every decision you’ve recorded." action={<button className="button" onClick={() => open()}><Plus /> Log trade</button>} />
    {error && <div className="notice">{error}</div>}
    <div className="toolbar">
      <div className="search"><Search /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search symbol or account…" /></div>
      <div className="filters"><Filter /><select value={outcome} onChange={(event) => setOutcome(event.target.value)}><option>All</option><option>Win</option><option>Loss</option><option>Break even</option></select><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="pl">Highest P/L</option></select></div>
    </div>
    {trades.length ? <div className="table-wrap"><table><thead><tr><th>Date</th><th>Account</th><th>Symbol</th><th>Position</th><th>Risk</th><th>RR</th><th>P/L</th><th>Outcome</th><th /></tr></thead><tbody>{filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((trade) => <tr key={trade.id}><td>{format(parseISO(trade.date), "MMM dd, yyyy")}</td><td>{accounts.find((item) => item.id === trade.accountId)?.name ?? "—"}</td><td><strong>{trade.symbol}</strong></td><td><span className={`position ${trade.position.toLowerCase()}`}>{trade.position}</span></td><td>${trade.risk.toFixed(2)}</td><td>{trade.rr.toFixed(2)}R</td><td className={trade.pl >= 0 ? "positive" : "negative"}>{trade.pl >= 0 ? "+" : ""}${trade.pl.toFixed(2)}</td><td><span className={`outcome ${trade.outcome.toLowerCase().replace(" ", "-")}`}>{trade.outcome}</span></td><td><div className="row-actions"><button onClick={() => open(trade)} title="View or edit"><MoreHorizontal /></button><button onClick={() => void remove(trade)} title="Delete">×</button></div></td></tr>)}</tbody></table><div className="pagination"><span>Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span><div><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></button><b>{page} / {pages}</b><button disabled={page === pages} onClick={() => setPage((value) => value + 1)}><ChevronRight /></button></div></div></div> : <EmptyState icon={TrendingUp} title="No trades yet" text="Log your first execution to start building your review history." />}
    {modal && <TradeForm accounts={accounts} trade={editing} onClose={close} onSaved={refresh} />}
  </div>;
}
