import type { Trade } from "@/types/trade";

export function tradesForAccount(trades: readonly Trade[], activeAccount: string) {
  return activeAccount ? trades.filter(trade => trade.accountName === activeAccount) : [...trades];
}

export function tradeBelongsToAccount(trade: Trade, activeAccount: string) {
  return !activeAccount || trade.accountName === activeAccount;
}
