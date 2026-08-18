import { NextRequest, NextResponse } from "next/server";
import { authenticatedFirebaseUid } from "@/lib/server/firebaseAuth";
import type { DiscoveredAccount } from "@/types/integration";
import { isValidTimeZone, normalizeTradovateFills, type TradovateContract, type TradovateFill, type TradovateProduct } from "@/utils/tradeImport";

type TradovateAccount = { id: number; name?: string; active?: boolean };
type RequestBody = { accessToken?: unknown; environment?: unknown; externalAccountId?: unknown; accountName?: unknown; connectionId?: unknown; timeZone?: unknown };

function apiBase(environment: "demo" | "live") {
  return environment === "live" ? "https://live.tradovateapi.com/v1" : "https://demo.tradovateapi.com/v1";
}

async function tradovateGet<T>(base: string, path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    headers: { accept: "application/json", authorization: `Bearer ${accessToken}` },
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(response.status === 401 ? "Tradovate rejected or expired this access token." : `Tradovate request failed (${response.status}): ${detail}`);
  }
  return response.json() as Promise<T>;
}

export async function POST(request: NextRequest) {
  try {
    if (!await authenticatedFirebaseUid(request)) return NextResponse.json({ error: "Your session could not be verified. Please log in again." }, { status: 401 });
    const body = await request.json() as RequestBody;
    const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : "";
    const environment = body.environment === "live" ? "live" : "demo";
    if (!accessToken || accessToken.length > 8_192) return NextResponse.json({ error: "Enter a valid short-lived Tradovate access token." }, { status: 400 });

    const base = apiBase(environment);
    const accountResult = await tradovateGet<unknown>(base, "/account/list", accessToken);
    const rawAccounts = Array.isArray(accountResult) ? accountResult as TradovateAccount[] : [];
    const accounts: DiscoveredAccount[] = rawAccounts.filter(account => Number.isFinite(account.id)).map(account => ({ id: String(account.id), name: account.name?.trim() || `Tradovate ${account.id}`, active: account.active !== false }));
    const externalAccountId = typeof body.externalAccountId === "string" ? body.externalAccountId : "";
    if (!externalAccountId) return NextResponse.json({ accounts, trades: [] });

    const selected = accounts.find(account => account.id === externalAccountId);
    if (!selected) return NextResponse.json({ error: "That Tradovate account was not returned for this token." }, { status: 400 });
    const connectionId = typeof body.connectionId === "string" ? body.connectionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 160) : "";
    if (!connectionId) return NextResponse.json({ error: "A saved connection ID is required before synchronizing." }, { status: 400 });
    const accountName = typeof body.accountName === "string" && body.accountName.trim() ? body.accountName.trim().slice(0, 60) : selected.name;
    const requestedTimeZone = typeof body.timeZone === "string" && body.timeZone.length < 100 ? body.timeZone : "America/New_York";
    if (!isValidTimeZone(requestedTimeZone)) return NextResponse.json({ error: "Choose a valid IANA timezone before synchronizing." }, { status: 400 });
    const timeZone = requestedTimeZone;

    const [allFills, contracts, products] = await Promise.all([
      tradovateGet<TradovateFill[]>(base, "/fill/list", accessToken),
      tradovateGet<TradovateContract[]>(base, "/contract/list", accessToken),
      tradovateGet<TradovateProduct[]>(base, "/product/list", accessToken),
    ]);
    const fills = Array.isArray(allFills) ? allFills.filter(fill => String(fill.accountId) === externalAccountId) : [];
    const trades = normalizeTradovateFills(fills, Array.isArray(contracts) ? contracts : [], accountName, connectionId, timeZone, Array.isArray(products) ? products : []).slice(0, 2_000);
    return NextResponse.json({ accounts, trades });
  } catch (error) {
    console.error("Tradovate synchronization failed", error);
    const message = error instanceof Error ? error.message : "Tradovate synchronization failed.";
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json({ error: timedOut ? "Tradovate took too long to respond. Try again." : message }, { status: timedOut ? 504 : 502 });
  }
}
