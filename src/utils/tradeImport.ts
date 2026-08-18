import type { ImportedTrade } from "@/types/integration";
import type { TradeOutcome, TradingSession } from "@/types/trade";

export type TradovateFill = { id: number; accountId: number; contractId: number; timestamp: string; action: "Buy" | "Sell"; qty: number; price: number; active?: boolean };
export type TradovateContract = { id: number; name?: string; productId?: number };
export type TradovateProduct = { id: number; name?: string; valuePerPoint?: number };

type PositionState = { accountId: number; contractId: number; direction: 1 | -1; openQty: number; entryQty: number; entryValue: number; exitValue: number; closedQty: number; entryTimestamp: string; exitTimestamp?: string; firstFillId: number };

function parts(timestamp: string, timeZone: string) {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "long" }).formatToParts(new Date(timestamp)).map(part => [part.type, part.value]));
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}`, weekday: values.weekday, hour: Number(values.hour) };
}

export function isValidTimeZone(value: string) {
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); return true; }
  catch { return false; }
}

export function tradingSessionForHour(hour: number): TradingSession {
  if (hour >= 18 || hour < 2) return "asia";
  if (hour < 8) return "london";
  if (hour < 11) return "overlap";
  if (hour < 17) return "new_york";
  return "other";
}

function outcome(direction: 1 | -1, entry: number, exit: number | undefined, stillOpen: boolean): TradeOutcome {
  if (stillOpen || exit == null) return "open";
  const movement = (exit - entry) * direction;
  return movement > 0 ? "win" : movement < 0 ? "loss" : "breakeven";
}

function imported(state: PositionState, contractName: string, accountName: string, connectionId: string, timeZone: string, valuePerPoint?: number): ImportedTrade {
  const entry = state.entryValue / state.entryQty;
  const exit = state.closedQty ? state.exitValue / state.closedQty : undefined;
  const pnl = exit != null && valuePerPoint != null && Number.isFinite(valuePerPoint) ? (exit - entry) * state.direction * state.closedQty * valuePerPoint : undefined;
  const start = parts(state.entryTimestamp, timeZone);
  const end = state.exitTimestamp ? parts(state.exitTimestamp, timeZone) : undefined;
  return { source: "imported", provider: "tradovate", connectionId, externalTradeId: `tradovate-${state.accountId}-${state.contractId}-${state.firstFillId}`, externalAccountId: String(state.accountId), accountName, date: start.date, dayOfWeek: start.weekday, session: tradingSessionForHour(start.hour), symbol: contractName, position: state.direction === 1 ? "long" : "short", lots: state.entryQty, entryPrice: entry, exitPrice: exit, entryTime: start.time, exitTime: end?.time, pnl, outcome: outcome(state.direction, entry, exit, state.openQty > 0) };
}

/** Converts ordered execution fills into stable round-trip journal records. */
export function normalizeTradovateFills(fills: readonly TradovateFill[], contracts: readonly TradovateContract[], accountName: string, connectionId: string, timeZone = "America/New_York", products: readonly TradovateProduct[] = []) {
  const names = new Map(contracts.map(contract => [contract.id, contract.name || `CONTRACT-${contract.id}`]));
  const productValues = new Map(products.map(product => [product.id, product.valuePerPoint]));
  const contractValues = new Map(contracts.map(contract => [contract.id, contract.productId == null ? undefined : productValues.get(contract.productId)]));
  const states = new Map<string, PositionState>();
  const completed: ImportedTrade[] = [];
  const ordered = [...fills].filter(fill => fill.active !== false && Number.isFinite(fill.id) && Number.isFinite(fill.accountId) && Number.isFinite(fill.contractId) && (fill.action === "Buy" || fill.action === "Sell") && Number.isFinite(fill.qty) && fill.qty > 0 && Number.isFinite(fill.price) && Number.isFinite(Date.parse(fill.timestamp))).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp) || a.id - b.id);
  for (const fill of ordered) {
    const key = `${fill.accountId}:${fill.contractId}`;
    const direction = fill.action === "Buy" ? 1 : -1;
    const state = states.get(key);
    if (!state) { states.set(key, { accountId: fill.accountId, contractId: fill.contractId, direction, openQty: fill.qty, entryQty: fill.qty, entryValue: fill.price * fill.qty, exitValue: 0, closedQty: 0, entryTimestamp: fill.timestamp, firstFillId: fill.id }); continue; }
    if (state.direction === direction) { state.openQty += fill.qty; state.entryQty += fill.qty; state.entryValue += fill.price * fill.qty; continue; }
    const closingQty = Math.min(state.openQty, fill.qty);
    state.openQty -= closingQty; state.closedQty += closingQty; state.exitValue += fill.price * closingQty; state.exitTimestamp = fill.timestamp;
    if (state.openQty === 0) { completed.push(imported(state, names.get(state.contractId) ?? `CONTRACT-${state.contractId}`, accountName, connectionId, timeZone, contractValues.get(state.contractId))); states.delete(key); }
    const reversedQty = fill.qty - closingQty;
    if (reversedQty > 0) states.set(key, { accountId: fill.accountId, contractId: fill.contractId, direction, openQty: reversedQty, entryQty: reversedQty, entryValue: fill.price * reversedQty, exitValue: 0, closedQty: 0, entryTimestamp: fill.timestamp, firstFillId: fill.id });
  }
  for (const state of states.values()) completed.push(imported(state, names.get(state.contractId) ?? `CONTRACT-${state.contractId}`, accountName, connectionId, timeZone, contractValues.get(state.contractId)));
  return completed.sort((a, b) => b.date.localeCompare(a.date) || (b.entryTime ?? "").localeCompare(a.entryTime ?? ""));
}
