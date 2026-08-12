import type { Trade } from "@/types/trade";
import { timestampToDate } from "./timestamps.ts";

const columns: ReadonlyArray<{ header: string; value: (trade: Trade) => unknown }> = [
  { header: "Trade ID", value: trade => trade.id },
  { header: "Account name", value: trade => trade.accountName },
  { header: "Date", value: trade => trade.date },
  { header: "Day of week", value: trade => trade.dayOfWeek },
  { header: "Session", value: trade => trade.session },
  { header: "Symbol", value: trade => trade.symbol },
  { header: "Position", value: trade => trade.position },
  { header: "Balance before trade", value: trade => trade.balanceBefore },
  { header: "Risk %", value: trade => trade.riskPercent },
  { header: "Risk amount", value: trade => trade.riskAmount },
  { header: "R:R", value: trade => trade.rr },
  { header: "P&L", value: trade => trade.pnl },
  { header: "P&L %", value: trade => trade.pnlPercent },
  { header: "Lots", value: trade => trade.lots },
  { header: "Outcome", value: trade => trade.outcome },
  { header: "Entry price", value: trade => trade.entryPrice },
  { header: "Exit price", value: trade => trade.exitPrice },
  { header: "Entry time", value: trade => trade.entryTime },
  { header: "Exit time", value: trade => trade.exitTime },
  { header: "Emotion", value: trade => trade.emotion },
  { header: "Setup", value: trade => trade.setup },
  { header: "Pre-trade notes", value: trade => trade.preTradeNotes },
  { header: "Post-trade notes", value: trade => trade.postTradeNotes },
  { header: "Chart images", value: trade => trade.chartImages?.join("\n") },
  { header: "Source", value: trade => trade.source },
  { header: "Created at", value: trade => timestampToDate(trade.createdAt)?.toISOString() },
  { header: "Updated at", value: trade => timestampToDate(trade.updatedAt)?.toISOString() },
];

function csvCell(value: unknown) {
  if (value === undefined || value === null) return "";
  let text = String(value);
  // Stop spreadsheet apps from evaluating user-entered text as a formula.
  if (/^[=+@]/.test(text) || /^-\D/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function tradesToCsv(trades: readonly Trade[]) {
  const rows = [columns.map(column => csvCell(column.header))];
  for (const trade of trades) rows.push(columns.map(column => csvCell(column.value(trade))));
  return rows.map(row => row.join(",")).join("\r\n");
}

export function tradeCsvFilename(date = new Date()) {
  return `trade-journal-${date.toISOString().slice(0, 10)}.csv`;
}
