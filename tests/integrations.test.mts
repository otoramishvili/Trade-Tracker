import test from "node:test";
import assert from "node:assert/strict";
import { CONNECTORS, PROP_FIRMS, connectorsForFirm } from "../src/data/integrationCatalog.ts";
import { isValidTimeZone, normalizeTradovateFills, tradingSessionForHour, type TradovateContract, type TradovateFill } from "../src/utils/tradeImport.ts";

test("integration catalog has unique firms and valid connector references", () => {
  const connectorIds = new Set(CONNECTORS.map(connector => connector.id));
  assert.equal(connectorIds.size, CONNECTORS.length);
  assert.equal(new Set(PROP_FIRMS.map(firm => firm.id)).size, PROP_FIRMS.length);
  for (const firm of PROP_FIRMS) {
    assert.ok(firm.connectors.length > 0);
    for (const connector of firm.connectors) assert.ok(connectorIds.has(connector));
  }
  assert.deepEqual(connectorsForFirm("unknown").map(connector => connector.id), CONNECTORS.map(connector => connector.id));
});

test("Tradovate fills become stable closed and open round trips", () => {
  const fills: TradovateFill[] = [
    { id: 1, accountId: 42, contractId: 7, timestamp: "2026-08-18T13:30:00Z", action: "Buy", qty: 2, price: 100 },
    { id: 2, accountId: 42, contractId: 7, timestamp: "2026-08-18T13:35:00Z", action: "Sell", qty: 1, price: 110 },
    { id: 3, accountId: 42, contractId: 7, timestamp: "2026-08-18T13:40:00Z", action: "Sell", qty: 2, price: 120 },
  ];
  const contracts: TradovateContract[] = [{ id: 7, name: "NQZ6", productId: 9 }];
  const trades = normalizeTradovateFills(fills, contracts, "Tradeify 50K", "connection-1", "America/New_York", [{ id: 9, name: "NQ", valuePerPoint: 20 }]);
  assert.equal(trades.length, 2);
  const closed = trades.find(trade => trade.externalTradeId.endsWith("-1"));
  const open = trades.find(trade => trade.externalTradeId.endsWith("-3"));
  assert.equal(closed?.symbol, "NQZ6");
  assert.equal(closed?.position, "long");
  assert.equal(closed?.entryPrice, 100);
  assert.equal(closed?.exitPrice, 115);
  assert.equal(closed?.lots, 2);
  assert.equal(closed?.pnl, 600);
  assert.equal(closed?.outcome, "win");
  assert.equal(closed?.date, "2026-08-18");
  assert.equal(closed?.dayOfWeek, "Tuesday");
  assert.equal(closed?.session, "overlap");
  assert.equal(open?.position, "short");
  assert.equal(open?.entryPrice, 120);
  assert.equal(open?.outcome, "open");
});

test("a partially exited position remains open", () => {
  const [trade] = normalizeTradovateFills([
    { id: 1, accountId: 1, contractId: 2, timestamp: "2026-08-18T12:00:00Z", action: "Buy", qty: 2, price: 100 },
    { id: 2, accountId: 1, contractId: 2, timestamp: "2026-08-18T12:05:00Z", action: "Sell", qty: 1, price: 110 },
  ], [{ id: 2, name: "ESZ6", productId: 3 }], "Account", "connection", "America/New_York", [{ id: 3, valuePerPoint: 50 }]);
  assert.equal(trade.outcome, "open");
  assert.equal(trade.exitPrice, 110);
  assert.equal(trade.pnl, 500);
});

test("session derivation covers the configured futures windows", () => {
  assert.equal(tradingSessionForHour(20), "asia");
  assert.equal(tradingSessionForHour(4), "london");
  assert.equal(tradingSessionForHour(9), "overlap");
  assert.equal(tradingSessionForHour(14), "new_york");
  assert.equal(tradingSessionForHour(17), "other");
});

test("inactive and invalid Tradovate fills are ignored", () => {
  const trades = normalizeTradovateFills([
    { id: 1, accountId: 1, contractId: 2, timestamp: "2026-08-18T12:00:00Z", action: "Buy", qty: 1, price: 100, active: false },
    { id: 2, accountId: 1, contractId: 2, timestamp: "2026-08-18T12:00:00Z", action: "Buy", qty: 0, price: 100 },
    { id: 3, accountId: 1, contractId: 2, timestamp: "not-a-timestamp", action: "Buy", qty: 1, price: 100 },
  ], [{ id: 2, name: "ESZ6" }], "Account", "connection");
  assert.deepEqual(trades, []);
});

test("timezone validation accepts IANA zones and rejects malformed values", () => {
  assert.equal(isValidTimeZone("America/New_York"), true);
  assert.equal(isValidTimeZone("Asia/Tbilisi"), true);
  assert.equal(isValidTimeZone("Mars/Olympus_Mons"), false);
});
