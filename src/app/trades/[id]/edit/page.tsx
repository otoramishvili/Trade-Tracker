"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { TradeForm } from "@/components/trades/TradeForm";
import { getTrade, updateTrade } from "@/lib/firebase/firestore";
import type { TradeDraft } from "@/types/trade";
import { useTradingAccounts } from "@/components/accounts/TradingAccountProvider";

const hiddenEditTradeFields = ["balanceBefore", "entryPrice", "exitPrice", "riskPercent", "pnlPercent"] as const;

export default function EditTrade() {
  return <AuthGuard><Edit /></AuthGuard>;
}

function Edit() {
  const { user } = useAuth();
  const { activeAccount } = useTradingAccounts();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [draft, setDraft] = useState<TradeDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!user) return;
    try {
      const trade = await getTrade(user.uid, id);
      if (!trade) { setError("This trade was not found or is no longer available."); return; }
      if (activeAccount && trade.accountName !== activeAccount) { setError("This trade belongs to a different trading account."); return; }
      const { id: _id, createdAt: _created, updatedAt: _updated, ...editable } = trade;
      void _id; void _created; void _updated;
      setDraft(editable);
    } catch (loadError) {
      console.error(loadError);
      setError("This trade could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, id, activeAccount]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <main className="center-state"><span className="loader" />Loading trade…</main>;
  if (error || !draft) return <main className="app-page"><div className="empty-state"><div className="empty-icon">?</div><h2>Unable to edit trade</h2><p>{error || "This trade is unavailable."}</p><Link className="button" href="/trades">Back to journal</Link></div></main>;
  return <main className="app-page"><div className="page-heading"><div><p className="eyebrow"><i />Journal</p><h1>Edit {draft.symbol}</h1><p className="page-subtitle">Update the fields below and save your changes.</p></div></div><TradeForm value={draft} onChange={setDraft} busy={busy} submitLabel="Update trade" hiddenFields={hiddenEditTradeFields} onCancel={() => router.push(`/trades/${id}`)} onSubmit={async (value, attachments) => { if (!user) return; setBusy(true); try { await updateTrade(user.uid, id, value, attachments.newChartFiles, attachments.removedChartImages); router.push(`/trades/${id}`); } finally { setBusy(false); } }} /></main>;
}
