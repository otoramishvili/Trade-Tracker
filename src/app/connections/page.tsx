"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTradingAccounts } from "@/components/accounts/TradingAccountProvider";
import { CONNECTORS, PROP_FIRMS, connectorsForFirm } from "@/data/integrationCatalog";
import { createConnection, getConnections, markConnectionSynced, removeConnection, upsertImportedTrades } from "@/lib/firebase/integrations";
import type { ConnectorId, DiscoveredAccount, SyncResponse, TradingConnection } from "@/types/integration";
import { timestampToDate } from "@/utils/timestamps";

type FormState = { firmId: string; customFirm: string; connector: ConnectorId; environment: "demo" | "live"; accessToken: string; accountId: string; accountName: string };
const initialForm: FormState = { firmId: "tradeify", customFirm: "", connector: "tradovate", environment: "demo", accessToken: "", accountId: "", accountName: "" };

export default function ConnectionsPage() {
  return <AuthGuard><Connections /></AuthGuard>;
}

function Connections() {
  const { user } = useAuth();
  const { accounts: savedAccountNames, addAccount } = useTradingAccounts();
  const [connections, setConnections] = useState<TradingConnection[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [discovered, setDiscovered] = useState<DiscoveredAccount[]>([]);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const connectorOptions = useMemo(() => connectorsForFirm(form.firmId), [form.firmId]);
  const selectedConnector = CONNECTORS.find(item => item.id === form.connector)!;
  const selectedFirm = PROP_FIRMS.find(item => item.id === form.firmId)!;

  const load = useCallback(async () => {
    if (!user) return;
    try { setConnections(await getConnections(user.uid)); }
    catch (loadError) { console.error(loadError); setError("Connections could not be loaded."); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  async function callTradovate(accessToken: string, options: { externalAccountId?: string; accountName?: string; connectionId?: string; environment: "demo" | "live" }) {
    if (!user) throw new Error("Not authenticated");
    const idToken = await user.getIdToken();
    const response = await fetch("/api/integrations/tradovate", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${idToken}` }, body: JSON.stringify({ accessToken, ...options, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }) });
    const result = await response.json() as SyncResponse & { error?: string };
    if (!response.ok) throw new Error(result.error || "Tradovate could not be reached.");
    return result;
  }

  async function discoverAccounts(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    if (selectedConnector.availability !== "available") { setError(`${selectedConnector.name} automatic sync is represented in the architecture but still needs approved API access.`); return; }
    setBusy("discover");
    try {
      const result = await callTradovate(form.accessToken, { environment: form.environment });
      setDiscovered(result.accounts);
      const first = result.accounts.find(account => account.active) ?? result.accounts[0];
      if (first) setForm(current => ({ ...current, accountId: first.id, accountName: first.name }));
      else setError("Tradovate returned no accounts for this token.");
    } catch (requestError) { console.error(requestError); setError(requestError instanceof Error ? requestError.message : "Account discovery failed."); }
    finally { setBusy(""); }
  }

  async function saveAndSync() {
    if (!user || !form.accountId || !form.accountName.trim()) return;
    setBusy("save"); setError(""); setMessage("");
    const firmName = form.firmId === "custom" ? form.customFirm.trim() : selectedFirm.name;
    if (!firmName) { setError("Enter the custom prop firm name."); setBusy(""); return; }
    let connectionId = "";
    try {
      connectionId = await createConnection(user.uid, { firmId: form.firmId, firmName, connector: form.connector, platformName: selectedConnector.name, environment: form.environment, externalAccountId: form.accountId, accountName: form.accountName.trim(), status: "needs_token" });
      const result = await callTradovate(form.accessToken, { environment: form.environment, externalAccountId: form.accountId, accountName: form.accountName.trim(), connectionId });
      if (!savedAccountNames.includes(form.accountName.trim())) await addAccount(form.accountName.trim());
      const count = await upsertImportedTrades(user.uid, result.trades);
      await markConnectionSynced(user.uid, connectionId);
      setForm(initialForm); setDiscovered([]); setMessage(`Connection saved. ${count} journal trades synchronized.`); await load();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "The connection could not be saved.");
      if (connectionId) await removeConnection(user.uid, connectionId).catch(cleanupError => console.warn("Failed connection metadata could not be removed.", cleanupError));
      await load();
    } finally { setBusy(""); }
  }

  async function sync(connection: TradingConnection) {
    if (!user) return;
    const accessToken = tokens[connection.id]?.trim();
    if (!accessToken) { setError("Paste a fresh Tradovate access token beside the account first."); return; }
    setBusy(connection.id); setError(""); setMessage("");
    try {
      const result = await callTradovate(accessToken, { environment: connection.environment, externalAccountId: connection.externalAccountId, accountName: connection.accountName, connectionId: connection.id });
      const count = await upsertImportedTrades(user.uid, result.trades);
      await markConnectionSynced(user.uid, connection.id);
      setTokens(current => ({ ...current, [connection.id]: "" }));
      setMessage(`${connection.accountName} synchronized: ${count} trades updated without duplicates.`);
      await load();
    } catch (syncError) { console.error(syncError); setError(syncError instanceof Error ? syncError.message : "Synchronization failed."); }
    finally { setBusy(""); }
  }

  async function disconnect(connection: TradingConnection) {
    if (!user || !confirm(`Disconnect ${connection.accountName}? Imported journal entries will be kept.`)) return;
    setBusy(connection.id); setError(""); setMessage("");
    try { await removeConnection(user.uid, connection.id); setConnections(current => current.filter(item => item.id !== connection.id)); setMessage("Connection removed. Existing journal entries were preserved."); }
    catch (removeError) { console.error(removeError); setError("The connection could not be removed."); }
    finally { setBusy(""); }
  }

  function chooseFirm(firmId: string) {
    const options = connectorsForFirm(firmId);
    setDiscovered([]);
    setForm(current => ({ ...current, firmId, connector: options[0]?.id ?? "csv", accountId: "", accountName: "" }));
  }

  return <main className="app-page connections-page">
    <div className="page-heading"><div><p className="eyebrow"><i />Automatic journal</p><h1>Trading connections</h1><p className="page-subtitle">Connect the execution backend behind your prop firm. Tokens are used for the request only and are never saved.</p></div></div>
    {error && <p className="alert" role="alert">{error}</p>}
    {message && <p className="success-message" role="status">✓ {message}</p>}

    <section className="connection-intro">
      <div><span>01</span><b>Choose prop firm</b><p>Pick a known firm or use the custom option.</p></div>
      <div><span>02</span><b>Choose backend</b><p>Tradovate, Rithmic, ProjectX, MT5 and others.</p></div>
      <div><span>03</span><b>Sync executions</b><p>Fills become editable journal entries without duplicates.</p></div>
    </section>

    <div className="connections-layout">
      <form className="connection-builder" onSubmit={discoverAccounts}>
        <div className="connection-heading"><div><span>New connection</span><h2>Link a trading account</h2></div><em>Secrets are not stored</em></div>
        <div className="connection-fields">
          <label>Prop firm<select value={form.firmId} onChange={event => chooseFirm(event.target.value)}>{PROP_FIRMS.map(firm => <option key={firm.id} value={firm.id}>{firm.name}</option>)}</select></label>
          {form.firmId === "custom" && <label>Firm name<input required value={form.customFirm} maxLength={80} placeholder="Enter prop firm" onChange={event => setForm({ ...form, customFirm: event.target.value })} /></label>}
          <label>Execution backend<select value={form.connector} onChange={event => { setDiscovered([]); setForm({ ...form, connector: event.target.value as ConnectorId, accountId: "", accountName: "" }); }}>{connectorOptions.map(connector => <option key={connector.id} value={connector.id}>{connector.name} — {connector.availability === "available" ? "available" : connector.availability === "import" ? "import" : "planned"}</option>)}</select></label>
          <label>Environment<select value={form.environment} onChange={event => setForm({ ...form, environment: event.target.value as "demo" | "live" })}><option value="demo">Demo / evaluation</option><option value="live">Live / funded</option></select></label>
        </div>
        <div className="connector-explanation"><b>{selectedConnector.name}</b><p>{selectedConnector.description}</p><span className={selectedConnector.availability}>{selectedConnector.availability}</span></div>
        {form.connector === "tradovate" && <>
          <label>Short-lived Tradovate access token<input type="password" required autoComplete="off" value={form.accessToken} placeholder="Paste token for this synchronization" onChange={event => setForm({ ...form, accessToken: event.target.value })} /><small>The browser sends this once to our authenticated server route. It is never written to Firebase.</small></label>
          <button className="button secondary" disabled={busy !== "" || !form.accessToken.trim()}>{busy === "discover" ? "Discovering accounts…" : "Test token & discover accounts"}</button>
        </>}
        {discovered.length > 0 && <div className="discovered-account">
          <label>Tradovate account<select value={form.accountId} onChange={event => { const account = discovered.find(item => item.id === event.target.value); setForm({ ...form, accountId: event.target.value, accountName: account?.name ?? "" }); }}>{discovered.map(account => <option key={account.id} value={account.id}>{account.name}{account.active ? "" : " (inactive)"}</option>)}</select></label>
          <label>Journal account name<input value={form.accountName} maxLength={60} onChange={event => setForm({ ...form, accountName: event.target.value })} /></label>
          <button className="button" type="button" disabled={busy !== "" || !form.accountId || !form.accountName.trim()} onClick={() => void saveAndSync()}>{busy === "save" ? "Saving & syncing…" : "Save connection & import trades"}</button>
        </div>}
      </form>

      <aside className="connector-roadmap"><span>Connector coverage</span><h2>One backend, many firms</h2><p>Front ends such as TradingView or NinjaTrader may still execute through Tradovate. Connect the backend that owns the fills.</p><div>{CONNECTORS.map(connector => <div key={connector.id}><b>{connector.name}</b><em className={connector.availability}>{connector.availability}</em></div>)}</div></aside>
    </div>

    <section className="saved-connections">
      <div className="saved-connections-heading"><div><span>Connected accounts</span><h2>Your synchronization sources</h2></div><small>{connections.length} saved</small></div>
      {loading ? <div className="connection-empty">Loading connections…</div> : connections.length ? <div className="connection-list">{connections.map(connection => <article key={connection.id}>
        <div className="connection-logo">{connection.platformName.slice(0, 2).toUpperCase()}</div>
        <div className="connection-copy"><span>{connection.firmName} · {connection.environment}</span><h3>{connection.accountName}</h3><p>{connection.platformName} account {connection.externalAccountId}{connection.lastSyncedAt ? ` · Last sync ${timestampToDate(connection.lastSyncedAt)?.toLocaleString() ?? "recently"}` : " · Never synchronized"}</p></div>
        {connection.connector === "tradovate" ? <div className="connection-sync"><input aria-label={`Access token for ${connection.accountName}`} type="password" autoComplete="off" placeholder="Fresh access token" value={tokens[connection.id] ?? ""} onChange={event => setTokens(current => ({ ...current, [connection.id]: event.target.value }))} /><button className="button small" disabled={busy !== "" || !(tokens[connection.id]?.trim())} onClick={() => void sync(connection)}>{busy === connection.id ? "Syncing…" : "Sync now"}</button></div> : <span className="planned-badge">Connector planned</span>}
        <button className="disconnect-button" disabled={busy !== ""} onClick={() => void disconnect(connection)}>Disconnect</button>
      </article>)}</div> : <div className="connection-empty"><b>No trading accounts connected yet.</b><p>Tradovate synchronization is available now. Other backends are shown as planned adapters.</p></div>}
    </section>
  </main>;
}
