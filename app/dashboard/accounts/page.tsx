"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { MoreHorizontal, Plus, WalletCards, X } from "lucide-react";
import { accountSchema } from "@/lib/schemas";
import { useJournal } from "@/hooks/use-journal";
import { useAuth } from "@/lib/auth-context";
import { createAccount, deleteAccount, updateAccount } from "@/services/journal";
import { EmptyState, PageTitle } from "@/components/dashboard-shell";
import type { Account } from "@/types";

type Values = z.infer<typeof accountSchema>;

export default function AccountsPage() {
  const { user } = useAuth();
  const { accounts, trades, refresh } = useJournal();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(accountSchema) });

  const open = (account?: Account) => {
    setEditing(account ?? null);
    reset(account ? { name: account.name, balance: account.balance } : { name: "", balance: 10000 });
    setModal(true);
  };
  const submit = async (values: Values) => {
    if (!user) return;
    try {
      setError("");
      if (editing) await updateAccount(editing.id, values);
      else await createAccount(user.uid, values);
      setModal(false);
      await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save account"); }
  };
  const remove = async (account: Account) => {
    if (trades.some((trade) => trade.accountId === account.id)) {
      setError("Delete this account's trades before deleting the account.");
      return;
    }
    if (!confirm(`Delete ${account.name}?`)) return;
    try { setError(""); await deleteAccount(account.id); await refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not delete account"); }
  };

  return <div className="page">
    <PageTitle eyebrow={`${accounts.length} OF 1 ACCOUNT`} title="Trading account" description="Manage the account used for your journal and performance tracking." action={<button className="button" disabled={accounts.length >= 1} onClick={() => open()}><Plus /> New account</button>} />
    {error && <div className="notice">{error}</div>}
    {accounts.length ? <div className="account-grid">{accounts.map((account) => {
      const accountTrades = trades.filter((trade) => trade.accountId === account.id);
      const accountPl = accountTrades.reduce((sum, trade) => sum + trade.pl, 0);
      return <article className="account-card" key={account.id}><div className="account-card-top"><span className="account-icon"><WalletCards /></span><button onClick={() => open(account)} aria-label="Edit account"><MoreHorizontal /></button></div><small>TRADING ACCOUNT</small><h3>{account.name}</h3><div className="balance"><span>Current balance</span><strong>${(account.balance + accountPl).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div><div className="account-meta"><span>Net P/L <b className={accountPl >= 0 ? "positive" : "negative"}>{accountPl >= 0 ? "+" : ""}${accountPl.toFixed(2)}</b></span><span>{accountTrades.length} trades</span></div><button className="delete-link" onClick={() => void remove(account)}>Delete account</button></article>;
    })}</div> : <EmptyState icon={WalletCards} title="Create your trading account" text="Your account keeps your balance and trade performance organized." action={<button className="button" onClick={() => open()}><Plus /> Create account</button>} />}
    {modal && <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><small>ACCOUNT DETAILS</small><h2>{editing ? "Edit account" : "New trading account"}</h2></div><button onClick={() => setModal(false)}><X /></button></div><form onSubmit={handleSubmit(submit)}><label>Account name<input placeholder="e.g. Personal" {...register("name")} />{errors.name && <em>{errors.name.message}</em>}</label><label>Starting balance<div className="money-input"><span>$</span><input type="number" step="0.01" {...register("balance")} /></div>{errors.balance && <em>{errors.balance.message}</em>}</label><div className="modal-actions"><button type="button" className="button ghost" onClick={() => setModal(false)}>Cancel</button><button className="button" disabled={isSubmitting}>Save account</button></div></form></div></div>}
  </div>;
}
