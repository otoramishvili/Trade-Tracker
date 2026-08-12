import test from "node:test";
import assert from "node:assert/strict";
import { dateKey, groupTradesByDate, monthGrid } from "../src/utils/calendar.ts";
import { tradeStats } from "../src/utils/tradeStats.ts";
import { validateTrade } from "../src/utils/tradeValidation.ts";
import { timestampMillis, timestampToDate } from "../src/utils/timestamps.ts";
import { tradeCsvFilename, tradesToCsv } from "../src/utils/tradeCsv.ts";
import { MAX_TRADING_ACCOUNTS, normalizeTradingAccounts } from "../src/utils/tradingAccounts.ts";
import { tradeBelongsToAccount, tradesForAccount } from "../src/utils/tradeAccounts.ts";
import { buildCoachEvidence } from "../src/utils/coachAnalytics.ts";
import { interactionOutputText } from "../src/utils/geminiInteraction.ts";
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

test("CSV export includes every trade field and safely escapes spreadsheet content",()=>{
  const trade={id:"trade-1",accountName:"Apex, 50K",date:"2026-08-12",dayOfWeek:"Wednesday",session:"new_york",symbol:"NQ",position:"long",balanceBefore:50000,riskPercent:1,riskAmount:100,rr:2,pnl:200,pnlPercent:0.4,lots:2,outcome:"win",entryPrice:21000,exitPrice:21020,entryTime:"14:30",exitTime:"14:42",emotion:"Calm",setup:"Breakout",preTradeNotes:"Line 1\nLine 2",postTradeNotes:"=DANGEROUS()",chartImages:["https://example.com/one.png","https://example.com/two.png"],source:"manual",createdAt:{seconds:1786521600,nanoseconds:0},updatedAt:{seconds:1786521660,nanoseconds:0}} as unknown as Trade;
  const csv=tradesToCsv([trade]);
  assert.match(csv,/"Account name"/);
  assert.match(csv,/"Apex, 50K"/);
  assert.match(csv,/"Line 1\nLine 2"/);
  assert.match(csv,/"'=DANGEROUS\(\)"/);
  assert.match(csv,/"https:\/\/example.com\/one.png\nhttps:\/\/example.com\/two.png"/);
  assert.match(csv,/"2026-08-12T08:00:00.000Z"/);
  assert.equal(tradeCsvFilename(new Date("2026-08-12T12:00:00Z")),"trade-journal-2026-08-12.csv");
});

test("trading accounts are trimmed, unique, and capped at twenty",()=>{
  const values=["  Apex 50K ","apex 50k","",...Array.from({length:25},(_,index)=>`Account ${index+1}`)];
  const accounts=normalizeTradingAccounts(values);
  assert.equal(MAX_TRADING_ACCOUNTS,20);
  assert.equal(accounts.length,20);
  assert.equal(accounts[0],"Apex 50K");
  assert.equal(accounts[1],"Account 1");
  assert.equal(accounts.at(-1),"Account 19");
});

test("active trading account isolates its own trades",()=>{
  const trades=[
    {id:"1",date:"2026-08-12",symbol:"NQ",position:"long",source:"manual",accountName:"Apex 50K"},
    {id:"2",date:"2026-08-12",symbol:"ES",position:"short",source:"manual",accountName:"Topstep 100K"},
    {id:"3",date:"2026-08-12",symbol:"GC",position:"long",source:"manual"},
  ] as Trade[];
  assert.deepEqual(tradesForAccount(trades,"Apex 50K").map(trade=>trade.id),["1"]);
  assert.deepEqual(tradesForAccount(trades,"").map(trade=>trade.id),["1","2","3"]);
  assert.equal(tradeBelongsToAccount(trades[1],"Apex 50K"),false);
  assert.equal(tradeBelongsToAccount(trades[1],""),true);
});

test("coach evidence calculates grouped performance without exposing chart URLs",()=>{
  const trades=[{id:"1",date:"2026-08-11",symbol:"NQ",position:"long",session:"new_york",source:"manual",outcome:"win",pnl:200,rr:2,chartImages:["secret-url"]},{id:"2",date:"2026-08-10",symbol:"NQ",position:"short",session:"new_york",source:"manual",outcome:"loss",pnl:-100,rr:1}] as Trade[];
  const evidence=buildCoachEvidence(trades,"Apex");
  assert.equal(evidence.sampleSize,2);
  assert.equal(evidence.winRate,50);
  assert.equal(evidence.bySession.new_york.pnl,100);
  assert.equal(evidence.summary.netR,1);
  assert.equal(JSON.stringify(evidence).includes("secret-url"),false);
});

test("Gemini Interactions response parser reads only model text steps",()=>{
  const answer=interactionOutputText({steps:[{type:"user_input",content:[{type:"text",text:"ignored"}]},{type:"thought",content:[{type:"text",text:"hidden"}]},{type:"model_output",content:[{type:"text",text:"Evidence-based answer"}]}]});
  assert.equal(answer,"Evidence-based answer");
  assert.equal(interactionOutputText({steps:[]}),"");
});
