"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { TradeForm } from "@/components/trades/TradeForm";
import { createTrade } from "@/lib/firebase/firestore";
import { emptyTrade, type TradeDraft } from "@/types/trade";

const hiddenNewTradeFields = ["balanceBefore", "entryPrice", "exitPrice", "riskPercent", "pnlPercent"] as const;

export default function NewTrade() {
  return <AuthGuard><NewTradeContent /></AuthGuard>;
}

function NewTradeContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [draft, setDraft] = useState<TradeDraft>(emptyTrade());
  const [busy, setBusy] = useState(false);

  async function save(value: TradeDraft) {
    if (!user) return;
    setBusy(true);
    try {
      const id = await createTrade(user.uid, value);
      router.push(`/trades/${id}`);
    } finally {
      setBusy(false);
    }
  }

  return <main className="app-page">
    <div className="page-heading">
      <div><p className="eyebrow">New journal entry</p><h1>Add a trade</h1></div>
    </div>
    <TradeForm value={draft} onChange={setDraft} onSubmit={save} busy={busy} hiddenFields={hiddenNewTradeFields} onCancel={() => router.push("/trades")} />
  </main>;
}
