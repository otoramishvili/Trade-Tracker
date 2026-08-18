"use client";

import { FormEvent, useState } from "react";
import { useTradingAccounts } from "@/components/accounts/TradingAccountProvider";
import type { TradeDraft } from "@/types/trade";
import { validateTrade, type TradeErrors } from "@/utils/tradeValidation";
import { ChartImagePicker } from "./ChartImagePicker";

const numericFields = ["balanceBefore", "entryPrice", "exitPrice", "riskPercent", "riskAmount", "rr", "pnl", "pnlPercent", "lots"] as const;
const labels: Record<string, string> = { balanceBefore: "Balance before trade", entryPrice: "Entry price", exitPrice: "Exit price", riskPercent: "Risk %", riskAmount: "Risk amount", rr: "R:R", pnl: "P&L", pnlPercent: "P&L %", lots: "Lots" };

type TradeFormProps = {
  value: TradeDraft;
  onChange: (value: TradeDraft) => void;
  onSubmit: (value: TradeDraft, attachments: TradeFormAttachments) => Promise<void>;
  busy?: boolean;
  submitLabel?: string;
  hiddenFields?: readonly (keyof TradeDraft)[];
  onCancel: () => void;
};

export type TradeFormAttachments = { newChartFiles: File[]; removedChartImages: string[] };

export function TradeForm({ value, onChange, onSubmit, busy = false, submitLabel = "Save trade", hiddenFields = [], onCancel }: TradeFormProps) {
  const { accounts } = useTradingAccounts();
  const [errors, setErrors] = useState<TradeErrors>({});
  const [saveError, setSaveError] = useState("");
  const [newChartFiles, setNewChartFiles] = useState<File[]>([]);
  const [removedChartImages, setRemovedChartImages] = useState<string[]>([]);
  const visibleNumericFields = numericFields.filter(key => !hiddenFields.includes(key));
  const set = (key: keyof TradeDraft, valueToSet: unknown) => onChange({ ...value, [key]: valueToSet });

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateTrade(value);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaveError("");
    try {
      await onSubmit(value, { newChartFiles, removedChartImages });
    } catch (error) {
      console.error(error);
      setSaveError("Your trade could not be saved. Please try again.");
    }
  }

  return <form className="trade-form" onSubmit={submit}>
    {saveError && <p className="alert" role="alert">{saveError}</p>}
    <fieldset><legend>Basic</legend><div className="form-grid">
      <Field label="Trading account" error={errors.accountName}><select value={value.accountName ?? ""} onChange={event => set("accountName", event.target.value)}><option value="">Choose account</option>{value.accountName && !accounts.includes(value.accountName) && <option value={value.accountName}>{value.accountName} (archived)</option>}{accounts.map(account => <option key={account} value={account}>{account}</option>)}</select></Field>
      <Field label="Date" error={errors.date}><input type="date" value={value.date} onChange={event => set("date", event.target.value)} /></Field>
      <Field label="Session"><select value={value.session ?? ""} onChange={event => set("session", event.target.value)}><option value="">Not specified</option><option value="asia">Asia</option><option value="london">London</option><option value="new_york">New York</option><option value="overlap">Overlap</option><option value="other">Other</option></select></Field>
      <Field label="Symbol" error={errors.symbol}><input placeholder="EURUSD" value={value.symbol} onChange={event => set("symbol", event.target.value.toUpperCase())} /></Field>
      <Field label="Position" error={errors.position}><select value={value.position} onChange={event => set("position", event.target.value)}><option value="">Choose side</option><option value="long">Long</option><option value="short">Short</option></select></Field>
    </div></fieldset>
    <fieldset><legend>Trade numbers</legend><div className="form-grid">
      {visibleNumericFields.map(key => <Field key={key} label={labels[key]} error={errors[key]}><input type="number" step="any" value={value[key] ?? ""} onChange={event => set(key, event.target.value === "" ? null : Number(event.target.value))} /></Field>)}
    </div></fieldset>
    <fieldset><legend>Result & timing</legend><div className="form-grid">
      <Field label="Outcome"><select value={value.outcome ?? ""} onChange={event => set("outcome", event.target.value)}><option value="">Not specified</option><option value="win">Win</option><option value="loss">Loss</option><option value="breakeven">Breakeven</option><option value="open">Open</option></select></Field>
      <Field label="Entry time"><input type="time" value={value.entryTime ?? ""} onChange={event => set("entryTime", event.target.value)} /></Field>
      <Field label="Exit time"><input type="time" value={value.exitTime ?? ""} onChange={event => set("exitTime", event.target.value)} /></Field>
    </div></fieldset>
    <fieldset><legend>Psychology</legend><div className="form-grid">
      <Field label="Emotion"><input value={value.emotion ?? ""} onChange={event => set("emotion", event.target.value)} /></Field>
      <Field label="Setup"><input value={value.setup ?? ""} onChange={event => set("setup", event.target.value)} /></Field>
    </div></fieldset>
    <fieldset><legend>Charts</legend><ChartImagePicker existingImages={value.chartImages ?? []} files={newChartFiles} onFilesChange={setNewChartFiles} onRemoveExisting={url => { set("chartImages", (value.chartImages ?? []).filter(image => image !== url)); setRemovedChartImages(current => [...current, url]); }} /></fieldset>
    <fieldset><legend>Notes</legend><div className="form-grid">
      <Field label="Pre-trade notes"><textarea rows={4} value={value.preTradeNotes ?? ""} onChange={event => set("preTradeNotes", event.target.value)} /></Field>
      <Field label="Post-trade notes"><textarea rows={4} value={value.postTradeNotes ?? ""} onChange={event => set("postTradeNotes", event.target.value)} /></Field>
    </div></fieldset>
    <div className="form-actions"><button type="button" className="button secondary" disabled={busy} onClick={onCancel}>Cancel</button><button className="button" disabled={busy}>{busy ? "Saving trade…" : submitLabel}</button></div>
  </form>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label>{label}{children}{error && <span className="field-error" role="alert">{error}</span>}</label>;
}
