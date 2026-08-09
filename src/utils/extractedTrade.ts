import type { ExtractedTrade } from "@/types/trade";

const stringFields=["symbol","entryTime","exitTime","emotion","setup","preTradeNotes","postTradeNotes"] as const;
const numberFields=["balanceBefore","riskPercent","riskAmount","rr","pnl","pnlPercent","lots","entryPrice","exitPrice"] as const;
const sessions=new Set(["asia","london","new_york","overlap","other"]);
const positions=new Set(["long","short"]);
const outcomes=new Set(["win","loss","breakeven","open"]);

export function sanitizeExtractedTrade(raw:Record<string,unknown>):ExtractedTrade{
  const clean:Record<string,unknown>={};
  for(const field of stringFields)if(typeof raw[field]==="string")clean[field]=raw[field];
  for(const field of numberFields)if(typeof raw[field]==="number"&&Number.isFinite(raw[field]))clean[field]=raw[field];
  if(typeof raw.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(raw.date)&&!Number.isNaN(new Date(`${raw.date}T12:00:00`).getTime()))clean.date=raw.date;
  if(typeof raw.session==="string"&&sessions.has(raw.session))clean.session=raw.session;
  if(typeof raw.position==="string"&&positions.has(raw.position))clean.position=raw.position;
  if(typeof raw.outcome==="string"&&outcomes.has(raw.outcome))clean.outcome=raw.outcome;
  return clean as ExtractedTrade;
}
