export const MAX_TRADING_ACCOUNTS = 20;

export function normalizeTradingAccounts(values: readonly unknown[]) {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const name = value.trim().slice(0, 60);
    const key = name.toLocaleLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length === MAX_TRADING_ACCOUNTS) break;
  }
  return names;
}
