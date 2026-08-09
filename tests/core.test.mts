import test from "node:test";
import assert from "node:assert/strict";
import { dateKey, groupTradesByDate, monthGrid } from "../src/utils/calendar.ts";
import { sanitizeExtractedTrade } from "../src/utils/extractedTrade.ts";
import { tradeStats } from "../src/utils/tradeStats.ts";
import { validateTrade } from "../src/utils/tradeValidation.ts";
import { timestampMillis, timestampToDate } from "../src/utils/timestamps.ts";
import type { Trade, TradeDraft } from "../src/types/trade.ts";

test("trade validation requires only date, symbol, and position",()=>{
  const valid:TradeDraft={date:"2026-08-09",symbol:" eurusd ",position:"long",source:"manual"};
  assert.deepEqual(validateTrade(valid),{});
  assert.deepEqual(validateTrade({...valid,date:"not-a-date"}).date,"Enter a valid date.");
  assert.deepEqual(validateTrade({...valid,symbol:""}).symbol,"Symbol is required.");
  assert.deepEqual(validateTrade({...valid,position:""}).position,"Position is required.");
});

test("trade validation rejects invalid optional numbers",()=>{
  const base:TradeDraft={date:"2026-08-09",symbol:"NAS100",position:"short",source:"manual"};
  assert.ok(validateTrade({...base,riskPercent:-1}).riskPercent);
  assert.ok(validateTrade({...base,lots:0}).lots);
  assert.ok(validateTrade({...base,entryPrice:Number.NaN}).entryPrice);
  assert.ok(validateTrade({...base,exitPrice:-2}).exitPrice);
});

test("statistics exclude breakeven from win rate and sum recorded pnl",()=>{
  const trades=[
    {id:"1",date:"2026-08-09",symbol:"A",position:"long",source:"manual",outcome:"win",pnl:100},
    {id:"2",date:"2026-08-08",symbol:"B",position:"short",source:"manual",outcome:"loss",pnl:-40},
    {id:"3",date:"2026-08-07",symbol:"C",position:"long",source:"manual",outcome:"breakeven"},
  ] as Trade[];
  assert.deepEqual(tradeStats(trades),{total:3,wins:1,losses:1,breakeven:1,winRate:50,totalPnl:60,pnlCount:2});
});

test("calendar grid is six complete Monday-first weeks",()=>{
  const grid=monthGrid(new Date(2026,7,1));
  assert.equal(grid.length,42);
  assert.equal(grid[0].date.getDay(),1);
  assert.equal(grid[41].date.getDay(),0);
  assert.equal(dateKey(new Date(2026,7,9)),"2026-08-09");
});

test("calendar groups trades without mutating them",()=>{
  const trades=[{id:"1",date:"2026-08-09"},{id:"2",date:"2026-08-09"},{id:"3",date:"2026-08-10"}] as Trade[];
  const groups=groupTradesByDate(trades);
  assert.equal(groups["2026-08-09"].length,2);
  assert.equal(groups["2026-08-10"].length,1);
});

test("AI sanitizer keeps schema values and rejects untrusted output",()=>{
  const clean=sanitizeExtractedTrade({symbol:"EURUSD",position:"long",session:"london",outcome:"win",rr:2,date:"2026-08-09",uid:"attacker",createdAt:"fake",riskPercent:Number.POSITIVE_INFINITY});
  assert.deepEqual(clean,{symbol:"EURUSD",rr:2,date:"2026-08-09",session:"london",position:"long",outcome:"win"});
  assert.deepEqual(sanitizeExtractedTrade({position:"buy",session:"mars",date:"tomorrow",rr:"2"}),{});
});

test("timestamps support Firestore instances and serialized legacy values",()=>{
  const expected="2026-08-09T10:20:30.123Z";
  const milliseconds=Date.parse(expected);
  const seconds=Math.floor(milliseconds/1_000);
  const nanoseconds=(milliseconds-seconds*1_000)*1_000_000;

  const values:unknown[]=[
    new Date(expected),
    expected,
    milliseconds,
    {toDate:()=>new Date(expected)},
    {toMillis:()=>milliseconds},
    {seconds,nanoseconds},
    {_seconds:seconds,_nanoseconds:nanoseconds},
  ];

  for(const value of values){
    assert.equal(timestampToDate(value)?.toISOString(),expected);
    assert.equal(timestampMillis(value),milliseconds);
  }
});

test("invalid timestamps are ignored instead of crashing trade pages",()=>{
  assert.equal(timestampToDate(undefined),null);
  assert.equal(timestampToDate(""),null);
  assert.equal(timestampToDate({toDate:"not a function"}),null);
  assert.equal(timestampToDate({toDate(){throw new Error("broken prototype")}}),null);
  assert.equal(timestampMillis({seconds:Number.NaN}),0);
});
