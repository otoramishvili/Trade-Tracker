"use client";
import { FormEvent,useCallback,useEffect,useMemo,useState } from "react";
import { useTradingAccounts } from "@/components/accounts/TradingAccountProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { getTrades } from "@/lib/firebase/firestore";
import type { Trade } from "@/types/trade";
import { buildCoachEvidence } from "@/utils/coachAnalytics";
import { tradesForAccount } from "@/utils/tradeAccounts";
const prompts=["Why am I losing?","What is my strongest edge?","What is my weakest session?","What should I focus on next week?"];
export default function CoachPage(){return <AuthGuard><Coach/></AuthGuard>}
function Coach(){
 const {user}=useAuth(),{activeAccount}=useTradingAccounts();
 const [trades,setTrades]=useState<Trade[]>([]),[question,setQuestion]=useState(""),[answer,setAnswer]=useState(""),[error,setError]=useState("");
 const [loading,setLoading]=useState(true),[asking,setAsking]=useState(false);
 const load=useCallback(async()=>{if(!user)return;try{setTrades(await getTrades(user.uid))}catch(e){console.error(e);setError("Your trades could not be loaded.")}finally{setLoading(false)}},[user]);
 useEffect(()=>{void load()},[load]);
 const visibleTrades=useMemo(()=>tradesForAccount(trades,activeAccount),[trades,activeAccount]);
 const closedTrades=visibleTrades.filter(t=>t.outcome==="win"||t.outcome==="loss").length;
 async function ask(event:FormEvent){event.preventDefault();if(!user||!question.trim())return;setAsking(true);setError("");setAnswer("");try{const token=await user.getIdToken();const response=await fetch("/api/coach",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${token}`},body:JSON.stringify({question,evidence:buildCoachEvidence(visibleTrades,activeAccount)})});const result=await response.json() as {answer?:string;error?:string};if(!response.ok)throw new Error(result.error||"The coach could not answer.");setAnswer(result.answer??"")}catch(e){console.error(e);setError(e instanceof Error?e.message:"The coach could not answer.")}finally{setAsking(false)}}
 if(loading)return <main className="center-state"><span className="loader"/>Preparing your coach…</main>;
 return <main className="app-page coach-page"><div className="page-heading"><div><p className="eyebrow"><i/>Evidence-based review</p><h1>Trading coach</h1><p className="page-subtitle">Ask about patterns in {activeAccount||"all accounts"}. Gemini receives calculated journal evidence, never your Firebase credentials.</p></div></div><section className="coach-context"><div><span>Analyzed trades</span><strong>{visibleTrades.length}</strong></div><div><span>Closed sample</span><strong>{closedTrades}</strong></div><div><span>Scope</span><strong>{activeAccount||"All accounts"}</strong></div></section>{!visibleTrades.length?<div className="empty-state"><div className="empty-icon">◎</div><h2>No evidence yet.</h2><p>Add trades to this account before asking the coach for analysis.</p></div>:<section className="coach-card"><div className="coach-intro"><span>Gemini coach</span><h2>What do you want to understand?</h2><p>Answers use your recorded statistics, setups, emotions and notes. They are process analysis—not trading signals.</p></div><div className="coach-prompts">{prompts.map(p=><button type="button" key={p} onClick={()=>setQuestion(p)}>{p}</button>)}</div><form onSubmit={ask}><label htmlFor="coach-question">Your question</label><textarea id="coach-question" rows={4} maxLength={1000} placeholder="Example: Why does my New York session performance look worse?" value={question} onChange={e=>setQuestion(e.target.value)}/><div><small>{question.length} / 1000</small><button className="button" disabled={asking||!question.trim()}>{asking?"Analyzing journal…":"Analyze my trading"}</button></div></form>{error&&<p className="alert" role="alert">{error}</p>}{answer&&<article className="coach-answer"><header><span>Journal analysis</span><small>Gemini 3.6 Flash</small></header><div>{answer}</div></article>}</section>}</main>;
}
