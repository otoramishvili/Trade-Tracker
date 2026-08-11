import type { Timestamp } from "firebase/firestore";
export type Position = "long" | "short";
export type TradingSession = "asia" | "london" | "new_york" | "overlap" | "other";
export type TradeOutcome = "win" | "loss" | "breakeven" | "open";
export type TradeSource = "manual";
export interface TradeDraft { accountName?: string; date: string; dayOfWeek?: string; session?: TradingSession | ""; symbol: string; position: Position | ""; balanceBefore?: number | null; riskPercent?: number | null; riskAmount?: number | null; rr?: number | null; pnl?: number | null; pnlPercent?: number | null; lots?: number | null; outcome?: TradeOutcome | ""; entryPrice?: number | null; exitPrice?: number | null; entryTime?: string; exitTime?: string; emotion?: string; setup?: string; preTradeNotes?: string; postTradeNotes?: string; chartImages?: string[]; source: TradeSource; }
export interface Trade extends Omit<TradeDraft,"position"|"session"|"outcome"> { id: string; position: Position; session?: TradingSession; outcome?: TradeOutcome; createdAt?: Timestamp; updatedAt?: Timestamp; }
export const emptyTrade = (): TradeDraft => {const now=new Date();const localDate=new Date(now.getTime()-now.getTimezoneOffset()*60_000).toISOString().slice(0,10);return {date:localDate,symbol:"",position:"",source:"manual"};};
