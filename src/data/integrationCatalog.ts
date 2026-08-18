import type { ConnectorId } from "@/types/integration";

export type ConnectorDefinition = {
  id: ConnectorId;
  name: string;
  category: "futures" | "forex_cfd" | "universal";
  availability: "available" | "planned" | "import";
  description: string;
};

export const CONNECTORS: readonly ConnectorDefinition[] = [
  { id: "tradovate", name: "Tradovate", category: "futures", availability: "available", description: "Direct account and fill synchronization using a short-lived Tradovate API token." },
  { id: "rithmic", name: "Rithmic", category: "futures", availability: "planned", description: "Covers TradeSea, Quantower, Sierra Chart and R|Trader accounts when vendor access is enabled." },
  { id: "projectx", name: "ProjectX / TopstepX", category: "futures", availability: "planned", description: "For firms and accounts running on the ProjectX gateway." },
  { id: "wealthcharts", name: "WealthCharts", category: "futures", availability: "planned", description: "Direct connector pending public account-history API access." },
  { id: "metatrader5", name: "MetaTrader 5", category: "forex_cfd", availability: "planned", description: "Will synchronize through an MT5 Expert Advisor or approved broker gateway." },
  { id: "ctrader", name: "cTrader", category: "forex_cfd", availability: "planned", description: "Will use cTrader Open API authorization." },
  { id: "tradelocker", name: "TradeLocker", category: "forex_cfd", availability: "planned", description: "Pending firm-supported API authorization." },
  { id: "matchtrader", name: "Match-Trader", category: "forex_cfd", availability: "planned", description: "Pending firm-supported API authorization." },
  { id: "dxtrade", name: "DXtrade", category: "forex_cfd", availability: "planned", description: "Pending firm-supported API authorization." },
  { id: "csv", name: "CSV / statement import", category: "universal", availability: "planned", description: "Planned fallback for firms or platforms without an approved API." },
] as const;

export type PropFirm = { id: string; name: string; market: "futures" | "forex_cfd" | "multi"; connectors: readonly ConnectorId[] };

// Product-owned seed catalog. The custom option keeps new firms usable immediately.
export const PROP_FIRMS: readonly PropFirm[] = [
  { id: "tradeify", name: "Tradeify", market: "futures", connectors: ["tradovate", "rithmic", "wealthcharts", "csv"] },
  { id: "topstep", name: "Topstep", market: "futures", connectors: ["projectx", "csv"] },
  { id: "apex", name: "Apex Trader Funding", market: "futures", connectors: ["rithmic", "tradovate", "csv"] },
  { id: "my-funded-futures", name: "My Funded Futures", market: "futures", connectors: ["tradovate", "rithmic", "projectx", "csv"] },
  { id: "take-profit-trader", name: "Take Profit Trader", market: "futures", connectors: ["tradovate", "rithmic", "csv"] },
  { id: "lucid-trading", name: "Lucid Trading", market: "futures", connectors: ["tradovate", "rithmic", "csv"] },
  { id: "funded-next-futures", name: "FundedNext Futures", market: "futures", connectors: ["tradovate", "projectx", "csv"] },
  { id: "alpha-futures", name: "Alpha Futures", market: "futures", connectors: ["projectx", "csv"] },
  { id: "ticktick-trader", name: "TickTickTrader", market: "futures", connectors: ["rithmic", "csv"] },
  { id: "bulenox", name: "Bulenox", market: "futures", connectors: ["rithmic", "csv"] },
  { id: "blue-sky", name: "Blue Sky Trading", market: "futures", connectors: ["rithmic", "csv"] },
  { id: "ftmo", name: "FTMO", market: "forex_cfd", connectors: ["metatrader5", "ctrader", "dxtrade", "csv"] },
  { id: "funding-pips", name: "FundingPips", market: "forex_cfd", connectors: ["metatrader5", "ctrader", "matchtrader", "csv"] },
  { id: "fundednext", name: "FundedNext", market: "forex_cfd", connectors: ["metatrader5", "ctrader", "matchtrader", "csv"] },
  { id: "the5ers", name: "The5ers", market: "forex_cfd", connectors: ["metatrader5", "ctrader", "csv"] },
  { id: "alpha-capital", name: "Alpha Capital Group", market: "forex_cfd", connectors: ["metatrader5", "ctrader", "dxtrade", "csv"] },
  { id: "blue-guardian", name: "Blue Guardian", market: "forex_cfd", connectors: ["metatrader5", "tradelocker", "matchtrader", "csv"] },
  { id: "fxify", name: "FXIFY", market: "forex_cfd", connectors: ["metatrader5", "dxtrade", "csv"] },
  { id: "maven", name: "Maven Trading", market: "forex_cfd", connectors: ["metatrader5", "matchtrader", "csv"] },
  { id: "e8-markets", name: "E8 Markets", market: "forex_cfd", connectors: ["metatrader5", "tradelocker", "csv"] },
  { id: "custom", name: "Other / custom prop firm", market: "multi", connectors: CONNECTORS.map(connector => connector.id) },
] as const;

export function connectorsForFirm(firmId: string) {
  const firm = PROP_FIRMS.find(item => item.id === firmId) ?? PROP_FIRMS.at(-1)!;
  return CONNECTORS.filter(connector => firm.connectors.includes(connector.id));
}
