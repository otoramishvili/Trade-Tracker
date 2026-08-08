"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { format } from "date-fns";
import { X } from "lucide-react";
import { tradeSchema } from "@/lib/schemas";
import { createTrade, updateTrade } from "@/services/journal";
import { useAuth } from "@/lib/auth-context";
import type { Account, Trade } from "@/types";

type Values = z.infer<typeof tradeSchema>;

export function TradeForm({ accounts, trade, onClose, onSaved }: { accounts: Account[]; trade?: Trade | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(tradeSchema),
    defaultValues: trade || { accountId: accounts[0]?.id || "", date: format(new Date(), "yyyy-MM-dd"), session: "New York", symbol: "", position: "Long", risk: 1, rr: 2, pl: 0, lots: 0.1, outcome: "Win", entryTime: "09:30", exitTime: "10:15", emotion: "Focused", preTrade: "", postTrade: "" },
  });

  const submit = async (values: Values) => {
    if (!user) return;
    try {
      setError("");
      const date = new Date(`${values.date}T12:00:00`);
      const data = { ...values, symbol: values.symbol.trim().toUpperCase(), balance: accounts.find((account) => account.id === values.accountId)?.balance || 0, weekday: format(date, "EEEE"), screenshot: trade?.screenshot || "" };
      if (trade) await updateTrade(trade.id, data);
      else await createTrade(user.uid, data);
      await onSaved();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save trade");
    }
  };

  return <div className="modal-backdrop"><div className="modal trade-modal"><div className="modal-head"><div><small>EXECUTION DETAILS</small><h2>{trade ? "Edit trade" : "Log a new trade"}</h2></div><button type="button" onClick={onClose} aria-label="Close trade form"><X /></button></div><form onSubmit={handleSubmit(submit)}><div className="form-grid"><label>Account<select {...register("accountId")}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label>Date<input type="date" {...register("date")} /></label><label>Symbol<input placeholder="EURUSD" {...register("symbol")} /></label><label>Session<select {...register("session")}><option>Asia</option><option>London</option><option>New York</option></select></label><label>Position<select {...register("position")}><option>Long</option><option>Short</option></select></label><label>Outcome<select {...register("outcome")}><option>Win</option><option>Loss</option><option>Break even</option></select></label><label>Risk ($)<input type="number" step="0.01" {...register("risk")} /></label><label>R multiple<input type="number" step="0.01" {...register("rr")} /></label><label>Profit / Loss ($)<input type="number" step="0.01" {...register("pl")} /></label><label>Lot size<input type="number" step="0.01" {...register("lots")} /></label><label>Entry time<input type="time" {...register("entryTime")} /></label><label>Exit time<input type="time" {...register("exitTime")} /></label><label className="span-2">Emotion<input placeholder="Focused, calm, anxious…" {...register("emotion")} /></label><label className="span-2">Pre-trade plan<textarea placeholder="What was your thesis and invalidation?" {...register("preTrade")} /></label><label className="span-2">Post-trade review<textarea placeholder="What went well? What will you change?" {...register("postTrade")} /></label></div>{Object.keys(errors).length > 0 && <div className="form-error">Please review the highlighted fields.</div>}{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="button ghost" onClick={onClose}>Cancel</button><button className="button" disabled={isSubmitting || !accounts.length}>{isSubmitting ? "Saving…" : "Save trade"}</button></div></form></div></div>;
}
