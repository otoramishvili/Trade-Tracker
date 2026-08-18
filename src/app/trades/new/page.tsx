"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { TradeForm, type TradeFormAttachments } from "@/components/trades/TradeForm";
import { createTrade } from "@/lib/firebase/firestore";
import { emptyTrade, type TradeDraft } from "@/types/trade";
import { useTradingAccounts } from "@/components/accounts/TradingAccountProvider";

const hiddenNewTradeFields = ["balanceBefore", "entryPrice", "exitPrice", "riskPercent", "pnlPercent"] as const;

export default function NewTrade() {
  return <AuthGuard><NewTradeContent /></AuthGuard>;
}

function NewTradeContent() {
  const { user } = useAuth();
  const { accounts, activeAccount } = useTradingAccounts();
  const router = useRouter();
  const [draft, setDraft] = useState<TradeDraft>(emptyTrade());
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (accounts.length) setDraft(current => current.accountName ? current : { ...current, accountName: activeAccount || accounts[0] }); }, [accounts, activeAccount]);

  async function save(value: TradeDraft, attachments: TradeFormAttachments) {
    if (!user) return;
    setBusy(true);
    try {
      const id = await createTrade(user.uid, value, attachments.newChartFiles);
      router.push(`/trades/${id}`);
    } finally {
      setBusy(false);
    }
  }

  if (!accounts.length) return <main className="app-page"><div className="empty-state"><div className="empty-icon">◇</div><h1>Add a trading account first</h1><p>Every journal entry must belong to a trading account. Add one manually or connect a supported execution platform.</p><div className="actions"><Link className="button" href="/settings#trading-accounts">Add trading account</Link><Link className="button secondary" href="/connections">Connect platform</Link></div></div></main>;

  return <main className="app-page">
    <div className="page-heading">
      <div><p className="eyebrow">New journal entry</p><h1>Add a trade</h1></div>
    </div>
    <TradeForm value={draft} onChange={setDraft} onSubmit={save} busy={busy} hiddenFields={hiddenNewTradeFields} onCancel={() => router.push("/trades")} />
  </main>;
}
