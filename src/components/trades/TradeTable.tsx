"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Trade, TradeOutcome } from "@/types/trade";

export function TradeTable({trades,onDelete}:{trades:Trade[];onDelete:(t:Trade)=>void}){
  const [search,setSearch]=useState("");
  const [outcome,setOutcome]=useState<TradeOutcome|"all">("all");
  const [side,setSide]=useState<"all"|"long"|"short">("all");
  const [sort,setSort]=useState<"newest"|"oldest">("newest");
  const filtered=useMemo(()=>trades.filter(trade=>{
    const query=search.trim().toLowerCase();
    const matchesSearch=!query||[trade.symbol,trade.setup,trade.session,trade.emotion].some(value=>value?.toLowerCase().includes(query));
    return matchesSearch&&(outcome==="all"||trade.outcome===outcome)&&(side==="all"||trade.position===side);
  }).sort((a,b)=>sort==="newest"?b.date.localeCompare(a.date):a.date.localeCompare(b.date)),[trades,search,outcome,side,sort]);
  const reset=()=>{setSearch("");setOutcome("all");setSide("all");setSort("newest")};

  return <section className="journal-browser">
    <div className="journal-toolbar"><label className="journal-search"><span>⌕</span><input aria-label="Search trades" placeholder="Search symbol, setup, session…" value={search} onChange={event=>setSearch(event.target.value)}/>{search&&<button aria-label="Clear search" onClick={()=>setSearch("")}>×</button>}</label><div className="journal-filters"><select aria-label="Filter by result" value={outcome} onChange={event=>setOutcome(event.target.value as TradeOutcome|"all")}><option value="all">All results</option><option value="win">Wins</option><option value="loss">Losses</option><option value="breakeven">Breakeven</option><option value="open">Open</option></select><select aria-label="Filter by side" value={side} onChange={event=>setSide(event.target.value as "all"|"long"|"short")}><option value="all">All sides</option><option value="long">Long</option><option value="short">Short</option></select><select aria-label="Sort trades" value={sort} onChange={event=>setSort(event.target.value as "newest"|"oldest")}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div></div>
    <div className="journal-table-head"><span>Trade</span><span>Date & session</span><span>Side</span><span>Result</span><span>R multiple</span><span>P&amp;L</span><span/></div>
    {filtered.length?<div className="journal-rows">{filtered.map(trade=><article className="journal-trade" key={trade.id}><Link className="journal-primary" href={`/trades/${trade.id}`}><span className="instrument-avatar">{trade.symbol.slice(0,2)}</span><span><b>{trade.symbol}</b><small>{trade.setup||"No setup recorded"}</small></span></Link><div className="journal-date"><b>{new Date(`${trade.date}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</b><small>{trade.session?.replace("_"," ")||"No session"}</small></div><span className={`side-chip ${trade.position}`}>{trade.position==="long"?"↗":"↘"} {trade.position}</span><span className={`result-badge ${trade.outcome??"open"}`}><i/>{trade.outcome??"open"}</span><strong className={(trade.rr??0)>0?"positive":""}>{trade.rr!=null?`${trade.rr}R`:"—"}</strong><strong className={(trade.pnl??0)>0?"positive":(trade.pnl??0)<0?"negative":""}>{trade.pnl!=null?`${trade.pnl>0?"+":""}${trade.pnl}`:"—"}</strong><div className="trade-menu"><Link title="View trade" aria-label={`View ${trade.symbol} trade`} href={`/trades/${trade.id}`}>→</Link><Link title="Edit trade" aria-label={`Edit ${trade.symbol} trade`} href={`/trades/${trade.id}/edit`}>✎</Link><button title="Delete trade" aria-label={`Delete ${trade.symbol} trade`} onClick={()=>onDelete(trade)}>×</button></div></article>)}</div>:<div className="filtered-empty"><span>⌕</span><h3>No matching trades</h3><p>Try a different search or clear your filters.</p><button onClick={reset}>Clear all filters</button></div>}
    <footer className="journal-footer"><span>Showing <b>{filtered.length}</b> of {trades.length} trades</span><span>Journal data from your private Firestore collection</span></footer>
  </section>
}
