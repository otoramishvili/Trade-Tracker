import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "./config";
import type { ConnectionDraft, ImportedTrade, TradingConnection } from "@/types/integration";
import { timestampMillis } from "@/utils/timestamps";
import { cleanTradeData } from "./firestore";

function assertOwner(uid: string) {
  if (!auth.currentUser || auth.currentUser.uid !== uid) throw new Error("Authenticated user does not own this path.");
}

export async function getConnections(uid: string) {
  assertOwner(uid);
  const snapshot = await getDocs(collection(db, "users", uid, "connections"));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() } as TradingConnection)).sort((a, b) => timestampMillis(b.updatedAt) - timestampMillis(a.updatedAt));
}

export async function createConnection(uid: string, draft: ConnectionDraft) {
  assertOwner(uid);
  const reference = await addDoc(collection(db, "users", uid, "connections"), { ...draft, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return reference.id;
}

export async function markConnectionSynced(uid: string, connectionId: string) {
  assertOwner(uid);
  await setDoc(doc(db, "users", uid, "connections", connectionId), { status: "needs_token", lastSyncedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
}

export async function removeConnection(uid: string, connectionId: string) {
  assertOwner(uid);
  await deleteDoc(doc(db, "users", uid, "connections", connectionId));
}

function importedDocumentId(connectionId: string, externalTradeId: string) {
  return `import_${connectionId}_${externalTradeId}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 900);
}

export async function upsertImportedTrades(uid: string, trades: readonly ImportedTrade[]) {
  assertOwner(uid);
  let saved = 0;
  for (let offset = 0; offset < trades.length; offset += 400) {
    const batch = writeBatch(db);
    for (const trade of trades.slice(offset, offset + 400)) {
      const reference = doc(db, "users", uid, "trades", importedDocumentId(trade.connectionId, trade.externalTradeId));
      batch.set(reference, cleanTradeData({ ...trade, symbol: trade.symbol.trim().toUpperCase(), importedAt: serverTimestamp(), updatedAt: serverTimestamp() }), { merge: true });
      saved += 1;
    }
    await batch.commit();
  }
  return saved;
}
