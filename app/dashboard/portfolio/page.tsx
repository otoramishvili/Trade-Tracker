"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import type { z } from "zod";
import { Activity, ArrowDownRight, ArrowUpRight, BriefcaseBusiness, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { PageTitle } from "@/components/dashboard-shell";
import { useAuth } from "@/lib/auth-context";
import { useJournal } from "@/hooks/use-journal";
import { paperPositionSchema } from "@/lib/schemas";
import { isSupportedCryptoSymbol } from "@/lib/coingecko";
import { createPaperPosition, deletePaperPosition, getPaperPositions, updatePaperPosition } from "@/services/journal";
import type { PaperPosition } from "@/types";

type Values = z.infer<typeof paperPositionSchema>;
type LivePrice = { price: number; change24h: number | null; updatedAt: number | null };
const money = (value: number) => value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const calculate = (position: PaperPosition, livePrice?: number) => {
  const multiplier = position.direction === "Long" ? 1 : -1;
  const currentPrice = livePrice ?? position.currentPrice;
  const pnl = (currentPrice - position.entryPrice) * position.quantity * multiplier;
  const notional = position.entryPrice * position.quantity;
  const margin = notional / position.leverage;
  return { pnl, notional, margin, currentPrice, returnOnMargin: margin ? (pnl / margin) * 100 : 0 };
};

export default function PortfolioPage() {
  const { user } = useAuth();
  const { accounts } = useJournal();
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<PaperPosition | null>(null);
  const [error, setError] = useState("");
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});
  const [priceStatus, setPriceStatus] = useState("");
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(paperPositionSchema) });
  const formMarket = watch("market");
  const formSymbol = watch("symbol") || "";
  const needsManualPrice = Boolean(editing && (formMarket !== "Crypto" || !isSupportedCryptoSymbol(formSymbol)));

  const load = useCallback(async () => {
    if (!user) return;
    try { setError(""); setPositions(await getPaperPositions(user.uid)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load positions"); }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const cryptoSymbols = useMemo(() => [...new Set(positions.filter((position) => position.market === "Crypto").map((position) => position.symbol.toUpperCase()))], [positions]);
  const symbolsKey = cryptoSymbols.join(",");
  const refreshLivePrices = useCallback(async () => {
    if (!symbolsKey) { setLivePrices({}); setPriceStatus(""); return; }
    try {
      setRefreshingPrices(true);
      const response = await fetch(`/api/crypto-prices?symbols=${encodeURIComponent(symbolsKey)}`);
      const result = await response.json() as { prices?: Record<string, LivePrice>; unsupported?: string[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Live prices are unavailable");
      setLivePrices(result.prices || {});
      setPriceStatus(result.unsupported?.length ? `Manual fallback: ${result.unsupported.join(", ")}` : `Live · updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    } catch (caught) {
      setPriceStatus(caught instanceof Error ? `${caught.message} · using manual prices` : "Using manual prices");
    } finally {
      setRefreshingPrices(false);
    }
  }, [symbolsKey]);

  useEffect(() => {
    void refreshLivePrices();
    if (!symbolsKey) return;
    const interval = window.setInterval(() => void refreshLivePrices(), 30000);
    return () => window.clearInterval(interval);
  }, [refreshLivePrices, symbolsKey]);

  const open = (position?: PaperPosition) => {
    setEditing(position || null);
    reset(position || { accountId: accounts[0]?.id || "", market: "Crypto", symbol: "BTC", direction: "Long", entryPrice: 100000, currentPrice: 100000, quantity: 0.001, leverage: 1, openedAt: format(new Date(), "yyyy-MM-dd"), thesis: "" });
    setModal(true);
  };

  const submit = async (values: Values) => {
    if (!user) return;
    try {
      setError("");
      const data = { ...values, symbol: values.symbol.trim().toUpperCase(), currentPrice: editing ? values.currentPrice : values.entryPrice };
      if (editing) await updatePaperPosition(editing.id, data);
      else await createPaperPosition(user.uid, data);
      await load();
      setModal(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save position");
    }
  };

  const remove = async (position: PaperPosition) => {
    if (!confirm(`Delete ${position.symbol} position?`)) return;
    try { setError(""); await deletePaperPosition(position.id); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not delete position"); }
  };

  const totals = useMemo(() => positions.reduce((result, position) => {
    const value = calculate(position, position.market === "Crypto" ? livePrices[position.symbol.toUpperCase()]?.price : undefined);
    return { notional: result.notional + value.notional, margin: result.margin + value.margin, pnl: result.pnl + value.pnl };
  }, { notional: 0, margin: 0, pnl: 0 }), [positions, livePrices]);

  return <div className="page">
    <PageTitle eyebrow="PAPER TRADING" title="Your fictional portfolio" description="Practice position sizing and leverage without risking real money." action={<button className="button" onClick={() => open()} disabled={!accounts.length}><Plus /> Add position</button>} />
    {error && <div className="notice">{error}</div>}
    <div className="portfolio-summary"><article><BriefcaseBusiness /><span>Total exposure</span><strong>{money(totals.notional)}</strong></article><article><Activity /><span>Margin used</span><strong>{money(totals.margin)}</strong></article><article className={totals.pnl >= 0 ? "positive-card" : "negative-card"}>{totals.pnl >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}<span>Unrealized P/L</span><strong>{totals.pnl >= 0 ? "+" : ""}{money(totals.pnl)}</strong></article></div>
    <div className="paper-note live-price-note"><RefreshCw className={refreshingPrices ? "spin" : ""} /><div><strong>Live crypto pricing</strong><p>CoinGecko refreshes supported crypto prices every 30 seconds. Other markets and unsupported symbols use your manual current price.</p>{priceStatus && <small>{priceStatus}</small>}</div><button type="button" className="button ghost small" onClick={() => void refreshLivePrices()} disabled={refreshingPrices || !cryptoSymbols.length}>{refreshingPrices ? "Refreshing…" : "Refresh prices"}</button></div>
    {positions.length ? <div className="position-grid">{positions.map((position) => {
      const quote = position.market === "Crypto" ? livePrices[position.symbol.toUpperCase()] : undefined;
      const value = calculate(position, quote?.price);
      return <article className="position-card" key={position.id}><div className="position-head"><div><span className={`position ${position.direction.toLowerCase()}`}>{position.direction}</span><h3>{position.symbol}</h3><small>{position.market} · {position.leverage}× leverage</small></div><button type="button" onClick={() => void remove(position)} aria-label={`Delete ${position.symbol} position`}><Trash2 /></button></div><div className="position-prices"><span>Entry <b>{money(position.entryPrice)}</b></span><span>{quote ? "Live" : "Current"} <b>{money(value.currentPrice)}</b>{quote?.change24h != null && <small className={quote.change24h >= 0 ? "positive" : "negative"}>{quote.change24h >= 0 ? "+" : ""}{quote.change24h.toFixed(2)}% 24h</small>}</span></div><div className="position-result"><span>Unrealized P/L</span><strong className={value.pnl >= 0 ? "positive" : "negative"}>{value.pnl >= 0 ? "+" : ""}{money(value.pnl)}</strong><small>{value.returnOnMargin.toFixed(2)}% return on margin · {money(value.margin)} used</small></div><button type="button" className="position-edit" onClick={() => open(position)}>Update position</button></article>;
    })}</div> : <div className="empty portfolio-empty"><BriefcaseBusiness /><h3>No paper positions yet</h3><p>{accounts.length ? "Add BTC, futures, forex, or another fictional position." : "Complete onboarding to create your first account."}</p>{accounts.length > 0 && <button className="button" onClick={() => open()}><Plus /> Add first position</button>}</div>}
    {modal && <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><small>PAPER POSITION</small><h2>{editing ? "Update position" : "Add fictional position"}</h2></div><button type="button" onClick={() => setModal(false)} aria-label="Close position form"><X /></button></div><form onSubmit={handleSubmit(submit)}><div className="form-grid"><label>Account<select {...register("accountId")}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label>Market<select {...register("market")}><option>Crypto</option><option>Forex</option><option>Futures</option><option>Stocks</option><option>Options</option></select></label><label>Symbol<input {...register("symbol")} />{errors.symbol && <em>{errors.symbol.message}</em>}</label><label>Direction<select {...register("direction")}><option>Long</option><option>Short</option></select></label><label>Entry price<input type="number" step="any" {...register("entryPrice")} /><small>New positions start at this price automatically.</small></label>{needsManualPrice && <label>Manual current price<input type="number" step="any" {...register("currentPrice")} /><small>Used because this asset has no live CoinGecko price.</small></label>}<label>Quantity<input type="number" step="any" {...register("quantity")} /></label><label>Leverage<input type="number" step="1" {...register("leverage")} /></label><label>Opened on<input type="date" {...register("openedAt")} /></label><label className="span-2">Thesis<textarea {...register("thesis")} placeholder="Why would you take this position?" /></label></div>{Object.keys(errors).length > 0 && <div className="form-error">Please review the highlighted fields.</div>}<div className="modal-actions"><button type="button" className="button ghost" onClick={() => setModal(false)}>Cancel</button><button className="button" disabled={isSubmitting}>Save position</button></div></form></div></div>}
  </div>;
}
