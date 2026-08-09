import type { Trade } from "@/types/trade";

export interface CalendarDay {
  date: Date;
  key: string;
  currentMonth: boolean;
}

export const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function monthGrid(month: Date): CalendarDay[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, key: dateKey(date), currentMonth: date.getMonth() === month.getMonth() };
  });
}

export function groupTradesByDate(trades: Trade[]) {
  return trades.reduce<Record<string, Trade[]>>((groups, trade) => {
    (groups[trade.date] ??= []).push(trade);
    return groups;
  }, {});
}
