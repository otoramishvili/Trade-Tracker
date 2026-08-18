"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTradingAccounts } from "@/components/accounts/TradingAccountProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { getTrades } from "@/lib/firebase/firestore";
import type { Trade } from "@/types/trade";
import { performanceStats, tradeStats } from "@/utils/tradeStats";
import { tradesForAccount } from "@/utils/tradeAccounts";

export default function Dashboard(){return <AuthGuard><DashboardContent/></AuthGuard>}

function DashboardContent(){
  const {user}=useAuth(); const {accounts,activeAccount}=useTradingAccounts();
  const [trades,setTrades]=useState<Trade[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const load=useCallback(async()=>{if(!user)return;try{setTrades(await getTrades(user.uid))}catch(loadError){console.error(loadError);setError("Your dashboard could not be loaded. Please refresh and try again.")}finally{setLoading(false)}},[user]);
  useEffect(()=>{void load()},[load]);
  if(loading)return <main className="center-state"><span className="loader"/>Loading dashboard…</main>;
  if(error)return <main className="app-page"><p className="alert" role="alert">{error}</p></main>;
  const visibleTrades=tradesForAccount(trades,activeAccount),stats={...tradeStats(visibleTrades),...performanceStats(visibleTrades)};
  const money=(value:number)=>new Intl.NumberFormat(undefined,{maximumFractionDigits:2,signDisplay:"exceptZero"}).format(value);
  const chartTrades=[...visibleTrades].filter(trade=>trade.pnl!=null).sort((a,b)=>a.date.localeCompare(b.date)).slice(-12);
  const maxPnl=Math.max(1,...chartTrades.map(trade=>Math.abs(trade.pnl??0)));
  return <main className="app-page dashboard-page">
    <div className="page-heading"><div><p className="eyebrow"><i/>Performance overview</p><h1>Good {new Date().getHours()<12?"morning":new Date().getHours()<18?"afternoon":"evening"}, {user?.displayName?.split(" ")[0]||"trader"}.</h1><p className="page-subtitle">{activeAccount?`Performance for ${activeAccount}.`:"Performance across all accounts."}</p></div><Link className="button" href={accounts.length?"/trades/new":"/settings#trading-accounts"}><span>{accounts.length?"＋":"◇"}</span> {accounts.length?"Add trade":"Add account"}</Link></div>
    {!visibleTrades.length?<div className="empty-state"><div className="empty-icon">↗</div><h2>{accounts.length?"No trades for this account.":"Add a trading account first."}</h2><p>{accounts.length?"Add a trade or switch accounts from the sidebar.":"Every trade must belong to a saved or connected trading account."}</p><Link className="button" href={accounts.length?"/trades/new":"/settings#trading-accounts"}>{accounts.length?"Add your first trade":"Add trading account"} <span>→</span></Link></div>:<>
      <section className="performance-hero"><Metric label="Net P&L" value={stats.pnlCount?money(stats.totalPnl):"—"} detail={`${stats.pnlCount} trades with recorded P&L`} tone={stats.totalPnl>0?"positive":stats.totalPnl<0?"negative":""}/><Metric label="Win rate" value={`${stats.winRate.toFixed(1)}%`} detail={`${stats.wins} wins · ${stats.losses} losses`}/><Metric label="Net performance" value={`${stats.netR>0?"+":""}${stats.netR.toFixed(1)}R`} detail={stats.averageR==null?"No R sample":`${stats.averageR>=0?"+":""}${stats.averageR.toFixed(2)}R average`} tone={stats.netR>0?"positive":stats.netR<0?"negative":""}/></section>
      <section className="dashboard-grid"><div className="performance-chart"><div className="panel-heading"><div><p className="eyebrow">Recent performance</p><h2>Recorded P&amp;L</h2></div><small>Last {chartTrades.length} trades</small></div>{chartTrades.length?<div className="pnl-bars" aria-label="Recent trade P and L chart">{chartTrades.map(trade=><Link key={trade.id} href={`/trades/${trade.id}`} title={`${trade.symbol}: ${money(trade.pnl??0)}`}><i className={(trade.pnl??0)>=0?"gain":"loss"} style={{height:`${Math.max(8,Math.abs(trade.pnl??0)/maxPnl*100)}%`}}/><span>{trade.symbol.slice(0,4)}</span></Link>)}</div>:<p className="chart-empty">Record P&amp;L to see performance here.</p>}</div><div className="secondary-stats"><SmallMetric label="Total trades" value={String(stats.total)}/><SmallMetric label="Average win" value={stats.averageWin==null?"—":money(stats.averageWin)} tone="positive"/><SmallMetric label="Average loss" value={stats.averageLoss==null?"—":money(stats.averageLoss)} tone="negative"/><SmallMetric label="Profit factor" value={stats.profitFactor==null?"—":stats.profitFactor.toFixed(2)}/></div></section>
      <section className="journal-panel"><div className="panel-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent trades</h2></div><Link href="/trades">View full journal <span>→</span></Link></div><div className="recent-list">{visibleTrades.slice(0,5).map(trade=><Link href={`/trades/${trade.id}`} className="recent-row" key={trade.id}><span className="trade-symbol">{trade.symbol.slice(0,2)}</span><span><b>{trade.symbol}</b><small>{trade.date} · {trade.session?.replace("_"," ")||"No session"}</small></span><span className={`side ${trade.position}`}>{trade.position}</span><span>{trade.rr!=null?`${trade.rr}R`:"—"}</span><span className={`pill ${trade.outcome??""}`}>{trade.outcome??"Not set"}</span><b className="row-arrow">→</b></Link>)}</div></section>
    </>}
  </main>
}
function Metric({label,value,detail,tone=""}:{label:string;value:string;detail:string;tone?:string}){return <article><span>{label}</span><strong className={tone}>{value}</strong><small>{detail}</small></article>}
function SmallMetric({label,value,tone=""}:{label:string;value:string;tone?:string}){return <article><span>{label}</span><strong className={tone}>{value}</strong></article>}
